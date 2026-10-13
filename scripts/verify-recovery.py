# Ayo Ahmed - Independent concept. Synthetic browser verification only.
from playwright.sync_api import sync_playwright
import json
import argparse
from pathlib import Path

parser=argparse.ArgumentParser(description='Verify the running synthetic booking UI; this does not record video.')
parser.add_argument('--url',default='http://127.0.0.1:8787/')
args=parser.parse_args()
Path('work/ui').mkdir(parents=True,exist_ok=True)
Path('docs/pixel-proof').mkdir(parents=True,exist_ok=True)
results={}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':390,'height':844},accept_downloads=True)
 page=context.new_page();page.goto(args.url);page.wait_for_selector('#primary-action:not([disabled])')
 def click(id):
  with page.expect_response(lambda r:'/api/action' in r.url and r.request.method=='POST') as result:page.locator(id).click()
  page.wait_for_function('() => !document.getElementById("reset-demo").disabled')
  return result.value.json()
 # Keyboard reservation, clock expiry, and explicit fresh quote then new reservation.
 page.locator('#primary-action').focus()
 with page.expect_response(lambda r:'/api/action' in r.url):page.keyboard.press('Enter')
 page.wait_for_function('() => !document.getElementById("reset-demo").disabled');assert '2:00 left' in page.locator('#hold-status').inner_text()
 click('#advance-clock');assert 'expired' in page.locator('#hold-status').inner_text()
 click('#primary-action');assert 'Hold both parts' in page.locator('#primary-action').inner_text()
 click('#primary-action');assert '2:00 left' in page.locator('#hold-status').inner_text()
 results['expiryKeyboard']='Keyboard hold, expiry release, fresh quote review then new hold passed.'
 # Actual safe generated import preview and atomic commit; stale evidence remains explicit.
 page.locator('.import-proof summary').click();click('#preview-import')
 assert '1 synthetic room' in page.locator('#import-preview').inner_text()
 committed=click('#commit-import');assert committed['ok'];assert len(committed['state']['catalog']['resources'])==4
 results['syntheticImport']='Generated strict room preview and atomic commit returned 4 resource records; no personal data input.'
 # Actual downloadable synthetic audit.
 with page.expect_download() as download:page.locator('#export-audit').click()
 download.value.save_as('work/ui/audit.json')
 audit=json.load(open('work/ui/audit.json'));assert audit['synthetic'] and audit['denominator']==len(audit['audit'])
 results['auditExport']={'synthetic':True,'rows':len(audit['audit']),'denominatorMatches':True}
 click('#reset-demo');
 # Simulate a genuinely unknown browser response after the server has committed the reservation.
 def lose_response(route):
  body=route.request.post_data_json
  if body.get('type')=='reserve':
   response=route.fetch();assert response.json()['ok'];route.abort();page.unroute('**/api/action',lose_response)
  else:route.continue_()
 page.route('**/api/action',lose_response)
 page.locator('#primary-action').click();page.wait_for_selector('#receipt-box')
 page.wait_for_function('() => !document.getElementById("reset-demo").disabled')
 assert page.locator('#primary-action').is_disabled()
 assert 'Unknown result' in page.locator('#receipt-box').inner_text()
 page.reload();page.wait_for_selector('#recover-receipt');assert page.locator('#primary-action').is_disabled()
 recovered=click('#recover-receipt');assert recovered['ok']
 assert len([b for b in recovered['state']['bookings'] if not b['competitor']])==1
 assert not page.locator('#primary-action').is_disabled()
 results['unknownResult']='Committed reserve response aborted; primary remained blocked across reload; receipt lookup recovered exactly one original booking.'
 # Native keyboard consent and validation.
 page.locator('#consent').focus()
 with page.expect_response(lambda r:'/api/action' in r.url):page.keyboard.press('Space')
 page.wait_for_function('() => !document.getElementById("reset-demo").disabled')
 page.locator('#primary-action').focus()
 with page.expect_response(lambda r:'/api/action' in r.url):page.keyboard.press('Enter')
 page.wait_for_function('() => !document.getElementById("reset-demo").disabled');assert 'Submit synthetic booking' in page.locator('#primary-action').inner_text()
 # Persistent disclosure remains inside viewport during lower-page actions.
 page.locator('#proof').scroll_into_view_if_needed();box=page.locator('.unofficial').bounding_box();assert 0<=box['y']<100
 assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
 page.screenshot(path='docs/pixel-proof/recovery-390.png',full_page=True)
 results['disclosure']='Synthetic unofficial disclosure stays visible while scrolling; no horizontal overflow.'
 context.close();browser.close()
open('work/ui/recovery-results.json','w').write(json.dumps(results,indent=2));print(json.dumps(results,indent=2))
