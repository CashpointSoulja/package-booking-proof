const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = (minor, currency = 'GBP') => new Intl.NumberFormat('en-GB', {style:'currency',currency}).format(minor / 100);
const time = (ms) => new Intl.DateTimeFormat('en-GB', {hour:'2-digit',minute:'2-digit',timeZone:'UTC'}).format(new Date(ms));
const dateTime = (ms) => new Intl.DateTimeFormat('en-GB', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'UTC'}).format(new Date(ms)) + ' UTC';
let state, token, quote, alternative, busy = false, lastKey = sessionStorage.getItem('proof-last-key'), pendingKey = null;
let chosenOption = 'standard', freshAfterBookingId = null, pendingUnknown=sessionStorage.getItem('proof-unknown')==='true';
if(pendingUnknown) pendingKey=lastKey;
const active = () => state?.bookings?.find((b) => b.id === state.activeBookingId && !b.competitor);
const isHolding = (b = active()) => b && b.status === 'held';
function notice(message, error = false) { $('global-message').hidden = !message; $('global-message').textContent = message; $('global-message').className = `notice${error ? ' error' : ''}`; }
async function request(path, body) {
  const headers = {}; if (token) headers['X-Session-Token'] = token;
  if (body) headers['Content-Type'] = 'application/json';
  const response = await fetch(path, {method:body ? 'POST':'GET',credentials:'same-origin',headers,body:body ? JSON.stringify(body):undefined});
  const result = await response.json();
  if (result.token) token = result.token;
  if (result.state) state = result.state;
  if (!response.ok && !result.code) throw new Error(result.message || `Request failed (${response.status}).`);
  return result;
}
async function action(name, data = {}) { return request('/api/action', {type:name,...data}); }
async function guard(fn) {
  if (busy) return; busy = true; render();
  try { await fn(); } catch (error) { if(pendingKey){pendingUnknown=true;sessionStorage.setItem('proof-unknown','true');} notice(`${error.message} Your result may be unknown. Use “Recover last receipt” before repeating a reservation or submission.`, true); }
  finally { busy = false; render(); }
}
function newKey(kind) { lastKey = `${kind}-${crypto.randomUUID()}`; sessionStorage.setItem('proof-last-key',lastKey); pendingKey = lastKey; return lastKey; }
async function loadQuotes() {
  const result = await action('availability');
  return result.quotes || state.quotes || [];
}
async function initialize(reset = false) {
  if (reset) { const result = await action('reset'); if (!result.ok) return notice(result.message,true); quote = null; alternative = null; chosenOption='standard'; freshAfterBookingId=null; lastKey = null; pendingKey=null; sessionStorage.removeItem('proof-last-key'); sessionStorage.removeItem('proof-unknown'); pendingUnknown=false; $('consent').checked=false; $('guest-preference').value='none'; $('conflict-box').hidden=true; $('import-preview').hidden=true; $('eval-results').innerHTML='<p class="fineprint">No checks have been run in this session.</p>'; }
  else await request('/api/session');
  const quotes = await loadQuotes();
  const booking = active();
  chosenOption = booking?.optionId || chosenOption;
  quote = quotes.find((q) => q.optionId === chosenOption) || quotes[0];
  if (booking) { $('consent').checked=!!booking.consent; $('guest-preference').value=booking.preferenceId || 'none'; }
  if (reset) notice('The synthetic scenario is reset in this visitor-isolated session.');
}
function renderComponents(parts = []) {
  const icons = ['<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 28V15M16 20C5 20 3 11 8 7c7 0 9 7 8 13Zm0 0c11 0 13-9 8-13-7 0-9 7-8 13ZM16 14c-6-5-5-10 0-13 5 3 6 8 0 13Z"/></svg>','<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 23h24M6 27h20M7 17h18v6H7Zm3-3c-6-5 5-5 0-11M16 14c-6-5 5-5 0-11M22 14c-6-5 5-5 0-11"/></svg>'];
  $('components').innerHTML = parts.map((p,i) => `<div class="component"><div class="component-icon">${icons[i%2]}</div><div><div class="component-title">${esc(p.name)}</div><div class="component-description">${i===0?'Practitioner + treatment room':'One place in a shared-area session'}</div></div><div class="component-time">${time(p.start)}–${time(p.end)}<span>${Math.round((p.end-p.start)/60000)} minutes</span></div></div>`).join('');
}
function render() {
  if (!state) { $('primary-action').disabled=true; return; }
  const booking = active();
  const shown = booking && !['expired','released','void'].includes(booking.status) ? booking : quote;
  const parts = shown?.parts || [];
  renderComponents(parts);
  const options = state.catalog.options;
  $('package-title').textContent=state.catalog.options[0].name;
  $('summary-package-name').textContent=shown?.name || options[0].name;
  $('slot-select').innerHTML = options.map((o) => `<option value="${esc(o.id)}"${chosenOption===o.id?' selected':''}>${time(o.parts[0].start)} · ${esc(o.name)}</option>`).join('');
  $('slot-select').disabled = busy || !!booking && !['expired','released','void'].includes(booking.status);
  $('summary-time').textContent = parts.length ? time(parts[0].start) : '—';
  $('summary-duration').textContent = parts.length ? `${Math.round((parts.at(-1).end-parts[0].start)/60000)} min total` : '—';
  $('summary-price').textContent = shown ? money(shown.totalMinor,shown.currency) : '—';
  $('clock-label').textContent = dateTime(state.clock);
  $('advance-clock').disabled=busy; $('reset-demo').disabled=busy;
  $('compete').disabled=busy || !!booking && !['expired','released','void'].includes(booking.status);
  $('revise-price').disabled=busy || !!booking && !['held','expired','released','void'].includes(booking.status);
  $('consent').disabled=busy || !!booking && !['held','expired','released','void'].includes(booking.status);
  $('guest-preference').disabled=$('consent').disabled;
  $('availability-note').textContent = quote ? `Snapshot revision ${quote.revision}. Checked again when you reserve.` : 'Availability will be checked again.';
  const valid = !!booking?.validation;
  $('step-hold').className = booking && !['expired','released','void'].includes(booking.status)?'done':'active';
  $('step-validate').className = booking?.status==='held' ? valid?'done':'active' : booking&&['submitted','settled','exception','fulfilled'].includes(booking.status)?'done':valid?'done':'';
  $('step-submit').className = booking?.status==='held'&&valid?'active':booking&&['submitted','settled','exception','fulfilled'].includes(booking.status)?'done':'';
  let title='Choose your moment', detail='Both parts are reserved together.', button='Hold both parts';
  if (booking?.status==='held') {
    const seconds = Math.max(0,Math.ceil((booking.expiresAt-state.clock)/1000));
    title=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')} left on this hold`;
    detail=valid?'Latest evidence validated. Ready to submit.':'Fixed simulation clock. Review the guest details.';
    button=valid?'Submit synthetic booking':'Validate latest evidence';
  } else if (booking) {
    const labels = {expired:['Your hold has expired','Every component has been released.','Get fresh availability'],released:['Your hold is released','Every component is available again.','Get fresh availability'],void:['Booking safely voided','Resources released. No fulfilment.','Get fresh availability'],submitted:['Submitted · settlement pending','Nothing can be fulfilled before settlement.','Submitted'],settled:['Simulated payment settled','The package is ready for fulfilment.','Payment settled'],fulfilled:['Package fulfilled','A settled booking completed its journey.','Fulfilled'],exception:['Payment needs attention','An owned exception is ready for handoff.','Owned exception']};
    [title,detail,button] = labels[booking.status] || [booking.status,'Review the audit for details.','Booking updated'];
    if (['expired','released','void'].includes(booking.status) && freshAfterBookingId===booking.id) {title='Fresh availability reviewed';detail='Confirm the displayed time and total.';button='Hold both parts';}
  }
  $('hold-status').innerHTML = `<span class="hold-icon" aria-hidden="true">${valid?'✓':'○'}</span><div><strong>${esc(title)}</strong><p>${esc(detail)}</p></div>`;
  $('primary-action').innerHTML = `${esc(button)} <span aria-hidden="true">→</span>`;
  $('primary-action').disabled = busy || pendingUnknown || !quote || !!booking && ['submitted','settled','exception','fulfilled'].includes(booking.status);
  $('release-hold').hidden = !isHolding(booking); $('release-hold').disabled=busy;
  $('receipt-box').hidden = !lastKey;
  const lastReceipt=state.receipts?.find((r)=>r.key===lastKey);
  if (lastKey) $('receipt-box').innerHTML=`<strong>${pendingUnknown?'Unknown result · lookup required':'Idempotent receipt lookup'}</strong><span>${esc(lastKey)}</span>${lastReceipt?`<br>Receipt ${esc(lastReceipt.id)} · booking ${esc(lastReceipt.bookingId)}`:''}<br><button id="recover-receipt" class="text-button" ${busy?'disabled':''}>Recover last receipt ↗</button><div id="receipt-detail"></div>`;
  document.querySelector('#recover-receipt')?.addEventListener('click',()=>guard(recoverReceipt));
  renderOutcome(booking);
  const sample=state.bookings.filter((b)=>!b.competitor), n=sample.length;
  $('observation-window').textContent=`Sample and denominator: ${n} visitor-created synthetic booking${n===1?'':'s'}. Window: this session through ${dateTime(state.clock)}.`;
  const metrics=[['Currently held',sample.filter((b)=>b.status==='held').length],['Submitted, awaiting settlement',sample.filter((b)=>b.status==='submitted').length],['Settlement confirmed',sample.filter((b)=>['settled','fulfilled'].includes(b.status)).length]];
  const allocated=new Set(state.bookings.filter((b)=>['held','submitted','settled','fulfilled'].includes(b.status)).map((b)=>b.optionId)).size;
  const supplyParts=state.catalog.options.flatMap((o)=>o.parts);
  $('observation-supply').innerHTML=`<strong>${allocated} / ${state.catalog.options.length} listed package opportunities allocated</strong><span>Supply window: ${time(Math.min(...supplyParts.map((p)=>p.start)))}–${time(Math.max(...supplyParts.map((p)=>p.end)))} UTC on the fixed demo day. Includes competing holds and unfulfilled reservations. Allocated capacity ≠ paid.</span>`;
  $('observation-stats').innerHTML=metrics.map(([label,count])=>`<div><strong>${count}<span> / ${n}</span></strong><span>${esc(label)}</span></div>`).join('');
}
function renderOutcome(booking) {
  const panel=$('outcome-panel'); panel.hidden=!booking || !['submitted','settled','exception','fulfilled'].includes(booking.status);
  if (panel.hidden) return;
  if (booking.status==='submitted') panel.innerHTML=`<p class="eyebrow">SUBMITTED ≠ SETTLED</p><h2>Your booking is submitted.</h2><p>Order ${esc(booking.orderId)} is awaiting simulated settlement. Booking reference: ${esc(booking.id)}. Capacity stays protected, and fulfilment is blocked until a successful settlement event arrives.</p><div class="outcome-actions"><button id="settle-failed" class="secondary-button">Simulate failed settlement</button><button id="settle-success" class="secondary-button">Simulate settled payment</button><button id="try-fulfill" class="text-button">Test fulfilment block ↗</button></div>`;
  else if (booking.status==='exception') panel.innerHTML=`<p class="eyebrow">OWNED EXCEPTION</p><h2>A failed payment has a next step.</h2><p>Nothing is fulfilled. The synthetic payment failure is recorded against this order.</p><div class="exception-details"><strong id="exception-owner">Owner: ${esc(booking.exception?.owner)}</strong><p>${esc(booking.exception?.nextStep)}</p></div><div class="outcome-actions"><button id="handoff-exception" class="secondary-button">Record synthetic handoff</button><button id="void-booking" class="secondary-button">Safely void & release capacity</button></div><p class="fineprint outcome-note">Handoff is a synthetic outbox record. No external message is sent.</p>`;
  else if (booking.status==='settled') panel.innerHTML=`<p class="eyebrow">SIMULATED SETTLEMENT CONFIRMED</p><h2>Every part is ready.</h2><p>The successful event is recorded. The package can now be fulfilled once.</p><div class="outcome-actions"><button id="fulfill-booking" class="secondary-button">Simulate package fulfilment</button><button id="repeat-settlement" class="text-button">Replay settled event ↗</button></div>`;
  else panel.innerHTML=`<p class="eyebrow">COMPLETE · SYNTHETIC</p><h2>A settled package, fulfilled.</h2><p>Every component completed together. Replay protection prevents a duplicate fulfilment.</p>`;
  $('settle-failed')?.addEventListener('click',()=>settlement('failed'));
  $('settle-success')?.addEventListener('click',()=>settlement('settled'));
  $('repeat-settlement')?.addEventListener('click',()=>settlement('settled'));
  $('try-fulfill')?.addEventListener('click',()=>guard(async()=>showResult(await action('fulfill',{bookingId:booking.id}))));
  $('fulfill-booking')?.addEventListener('click',()=>guard(async()=>showResult(await action('fulfill',{bookingId:booking.id}))));
  $('handoff-exception')?.addEventListener('click',()=>guard(async()=>{const result=await action('outbox',{bookingId:booking.id});showResult(result,result.ok?'Synthetic handoff recorded. Owner: Demo operations lead. No external message was sent.':undefined);}));
  $('void-booking')?.addEventListener('click',()=>guard(async()=>{const result=await action('void',{bookingId:booking.id});showResult(result,result.ok?'Booking safely voided; every component released.':undefined);}));
}
function showResult(result, successMessage) { notice(result.ok ? successMessage || result.message || 'The synthetic state was updated.' : `${result.code}: ${result.message}`, !result.ok); return result; }
async function syncGuest() { const booking=active(); if(!isHolding(booking))return; const result=await action('edit',{bookingId:booking.id,guestId:'synthetic-guest-01',consent:$('consent').checked,preferenceId:$('guest-preference').value}); showResult(result,result.ok?'Guest evidence updated. Any earlier validation is invalidated.':undefined); }
async function showAlternative(result) {
  const previous=quote || active(); const quotes=await loadQuotes();
  alternative=quotes.find((q)=>q.available!==false && q.optionId!==(previous?.optionId||chosenOption)) || quotes.find((q)=>q.available!==false) || (isHolding()?quotes.find((q)=>q.optionId===active().optionId):null);
  if(!alternative)return notice('No complete alternative is currently available. Release an existing hold or start a fresh demo session.',true);
  const holding=isHolding();
  $('conflict-box').hidden=false;
  $('conflict-box').innerHTML=`<p class="eyebrow">YOUR CHOICE IS STILL YOURS</p><h3>Something changed. Here’s another option.</h3><p>${esc(result.message || 'The earlier snapshot can no longer be reserved.')}</p><div class="change-grid"><div><span>YOUR EARLIER CHOICE</span><strong>${previous?.parts?.length?time(previous.parts[0].start):'—'} · ${previous?money(previous.totalMinor,previous.currency):'—'}</strong></div><div><span>EXPLICIT ALTERNATIVE</span><strong>${time(alternative.parts[0].start)} · ${money(alternative.totalMinor,alternative.currency)}</strong></div></div><div class="alternative-parts">${alternative.parts.map((p,i)=>`<div><strong>${esc(p.name)}</strong><span>${time(p.start)}–${time(p.end)} · ${i===0?'practitioner + treatment room':'shared-area place'}</span></div>`).join('')}</div><p>Both start time and total are shown before you accept.${holding?' Accepting will release your previous hold and reserve this alternative.':''}</p><button id="accept-alternative" class="primary-button">${holding?'Release old hold & accept changes':'Accept changes & hold both parts'} <span aria-hidden="true">→</span></button><button id="dismiss-alternative" class="text-button">Keep my current choice</button>`;
  $('accept-alternative').addEventListener('click',()=>guard(async()=>{
    if(pendingUnknown)return notice('Recover the unknown receipt before making another reservation.',true);
    const accepted=alternative;
    if(isHolding()){const release=await action('release',{bookingId:active().id});if(!release.ok)return showResult(release);const fresh=await loadQuotes();alternative=fresh.find((q)=>q.optionId===accepted.optionId);if(!alternative || alternative.totalMinor!==accepted.totalMinor || JSON.stringify(alternative.parts)!==JSON.stringify(accepted.parts))return showAlternative({message:'The accepted alternative changed again. Please review the latest evidence.'});}
    quote=alternative;chosenOption=quote.optionId;alternative=null;
    const result=await action('reserve',{quoteId:quote.id,idempotencyKey:newKey('reserve')});
    showResult(result,result.ok?'Alternative accepted. Both parts are held at the displayed time and total.':undefined);
    if(result.ok){$('conflict-box').hidden=true;pendingKey=null;}else await showAlternative(result);
  }));
  $('dismiss-alternative').addEventListener('click',()=>{$('conflict-box').hidden=true;alternative=null;notice('Your earlier choice remains selected. Refresh availability before reserving again.');});
}
async function recoverReceipt(){const result=await action('receipt',{idempotencyKey:lastKey});showResult(result,result.ok?'The authoritative receipt was recovered. Repeating the same key cannot create another booking.':undefined);if(result.ok || /NOT_FOUND|UNKNOWN_RECEIPT|UNKNOWN_KEY/.test(result.code)){pendingUnknown=false;pendingKey=null;sessionStorage.removeItem('proof-unknown');}}
function settlement(status) { guard(async()=>{const booking=active();showResult(await action('settle',{bookingId:booking.id,eventId:`demo-settlement-${booking.id}`,sequence:1,status}),status==='failed'?'Settlement failed. An owned exception is ready.':'Simulated settlement recorded. Fulfilment is now allowed.');}); }
$('primary-action').addEventListener('click',()=>guard(async()=>{
  const booking=active();
  if(!booking || ['expired','released','void'].includes(booking.status)){
    if(booking && freshAfterBookingId!==booking.id){const quotes=await loadQuotes();quote=quotes.find((q)=>q.optionId===chosenOption)||quotes[0];freshAfterBookingId=booking.id;pendingKey=null;notice('Fresh availability loaded. Review the current total, then hold both parts.');return;}
    const result=await action('reserve',{quoteId:quote.id,idempotencyKey:pendingKey||newKey('reserve')});showResult(result,result.ok?'Both parts are held together. Add consent, then validate the latest evidence.':undefined);if(result.ok){pendingKey=null;$('conflict-box').hidden=true;}else await showAlternative(result);
  } else if(!booking.validation){
    const edit=await action('edit',{bookingId:booking.id,guestId:'synthetic-guest-01',consent:$('consent').checked,preferenceId:$('guest-preference').value});if(!edit.ok)return showResult(edit);
    const result=await action('validate',{bookingId:booking.id});showResult(result,result.ok?'Latest availability, price and guest evidence are validated. Ready to submit.':undefined);if(!result.ok&&/STALE|PRICE|REVISION/.test(result.code))await showAlternative(result);
  }else {const result=await action('submit',{bookingId:booking.id,idempotencyKey:pendingKey||newKey('submit')});showResult(result,result.ok?'Booking submitted. Simulated payment is still pending; nothing is fulfilled.':undefined);if(result.ok)pendingKey=null;else if(/STALE|PRICE|REVISION/.test(result.code))await showAlternative(result);}
}));
$('slot-select').addEventListener('change',()=>guard(async()=>{chosenOption=$('slot-select').value;const quotes=await loadQuotes();quote=quotes.find((q)=>q.optionId===chosenOption);$('conflict-box').hidden=true;notice('Start time selected. Review the displayed total before you reserve.');}));
$('compete').addEventListener('click',()=>guard(async()=>showResult(await action('compete'),'A competing synthetic booking took the last place. Try holding your earlier snapshot to see the conflict.')));
$('revise-price').addEventListener('click',()=>guard(async()=>showResult(await action('price-change',{optionId:chosenOption,deltaMinor:500}),'The authoritative price increased by £5.00. Your earlier displayed quote is preserved until you review a fresh alternative.')));
$('advance-clock').addEventListener('click',()=>guard(async()=>showResult(await action('advance',{seconds:360}),'Simulation advanced six minutes. Expired holds have released every component.')));
$('reset-demo').addEventListener('click',()=>guard(()=>initialize(true)));
$('release-hold').addEventListener('click',()=>guard(async()=>showResult(await action('release',{bookingId:active().id}),'Hold released. Both parts are available again.')));
$('consent').addEventListener('change',()=>guard(syncGuest));
$('guest-preference').addEventListener('change',()=>guard(syncGuest));
$('export-audit').addEventListener('click',()=>guard(async()=>{
  await request('/api/state');
  const content={author:'Ayo Ahmed - Independent concept',synthetic:true,unofficial:true,notConnectedToTrybe:true,simulationClock:state.clock,window:'This visitor-isolated synthetic session only',denominator:state.audit.length,audit:state.audit,outbox:state.outbox};
  const url=URL.createObjectURL(new Blob([JSON.stringify(content,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='synthetic-session-audit.json';link.click();URL.revokeObjectURL(url);notice('Synthetic session audit exported. It describes this simulation only; no impact or uplift claim is made.');
}));
async function runEvaluation(broken){await guard(async()=>{
  $('eval-results').innerHTML='<p class="fineprint">Executing deterministic checks…</p>';
  const result=await request(`/api/eval${broken?'?broken=1':''}`);const data=result.evaluation || result;
  const stringify=(v)=>typeof v==='string'?v:JSON.stringify(v);
  $('eval-results').innerHTML=`<div class="eval-summary"><strong class="${data.failed?'fail':'pass'}">${data.passed}/${data.total} scenarios passed · ${data.failed} failed</strong><span>${data.assertions} executed assertions${broken?' · broken rule injected':''}</span></div>${data.cases.map((c)=>`<details class="eval-case${c.passed?'':' failed'}"${!c.passed?' open':''}><summary>${esc(c.name)} <span class="case-state">${c.passed?'PASS':'FAIL'}</span></summary><div class="assertion assertion-labels"><span>ASSERTION</span><span>EXPECTED</span><span>ACTUAL</span></div>${c.assertions.map((a)=>`<div class="assertion${a.passed?'':' failed'}"><span>${esc(a.label)}</span><span>${esc(stringify(a.expected))}</span><span>${esc(stringify(a.actual))} ${a.passed?'✓':'✕'}</span></div>`).join('')}</details>`).join('')}`;
  notice(broken?'A rule is deliberately broken in the evaluator. Red results show the checks detect the regression; booking rules are unchanged.':'Deterministic evidence executed against the same domain rules as the booking.');
});}
$('preview-import').addEventListener('click',()=>guard(async()=>{
  const result=await action('import-preview',{rows:[{synthetic:true,site:'site-a',offeringType:'room',id:'synthetic-room-03',capacity:1,currency:'GBP'}]});showResult(result);if(!result.ok)return;
  $('import-preview').hidden=false;$('import-preview').innerHTML=`<p><strong>Preview: 1 synthetic room</strong><br>Site A · capacity 1 · GBP. Nothing is imported until you commit.</p><button id="commit-import" class="secondary-button">Commit this synthetic preview</button>`;
  $('commit-import').addEventListener('click',()=>guard(async()=>{const committed=await action('import-commit',{previewId:result.previewId});showResult(committed,committed.ok?'One synthetic room committed atomically. Existing package resources were unchanged.':undefined);if(committed.ok)$('import-preview').hidden=true;}));
}));
$('run-eval').addEventListener('click',()=>runEvaluation(false));$('run-broken').addEventListener('click',()=>runEvaluation(true));
for(const el of document.querySelectorAll('button,input,select'))if(el.id)el.dataset.testid=el.id;
guard(()=>initialize());
