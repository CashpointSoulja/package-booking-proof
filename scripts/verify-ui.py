# Ayo Ahmed - Independent concept. Synthetic browser verification only.
from playwright.sync_api import sync_playwright
import json, os
import argparse
from pathlib import Path

parser=argparse.ArgumentParser(description='Verify the running synthetic booking UI; this does not record video.')
parser.add_argument('--url',default='http://127.0.0.1:8787/')
args=parser.parse_args()
Path('work/ui').mkdir(parents=True,exist_ok=True)
Path('docs/pixel-proof').mkdir(parents=True,exist_ok=True)
out='docs/pixel-proof'
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True, args=['--no-sandbox'])
 for width in [320,390,540,1440]:
  context=browser.new_context(viewport={'width':width,'height':900})
  page=context.new_page(); errors=[]
  page.on('pageerror',lambda e: errors.append(str(e)))
  page.on('console',lambda m: errors.append(m.text) if m.type=='error' and '409 (Conflict)' not in m.text else None)
  page.goto(args.url);page.wait_for_selector('#primary-action:not([disabled])')
  def snapshot(name, focus=None):
   if focus:page.locator(focus).scroll_into_view_if_needed()
   page.screenshot(path=f'{out}/{name}-crop-{width}.png',full_page=False)
   page.evaluate('window.scrollTo(0,0)');page.wait_for_function('() => window.scrollY === 0')
   page.screenshot(path=f'{out}/{name}-{width}.png',full_page=True)
  snapshot('initial')
  overflow=page.evaluate('document.documentElement.scrollWidth > window.innerWidth')
  assert not overflow, f'initial overflow {width}'
  def click(id):
   with page.expect_response(lambda r: '/api/action' in r.url and r.request.method=='POST') as response:
    page.locator(id).click()
   page.wait_for_function('() => !document.getElementById("reset-demo").disabled')
  click('#compete');click('#primary-action')
  page.wait_for_selector('#accept-alternative')
  assert '16:00' in page.locator('#conflict-box').inner_text()
  assert '£120.00' in page.locator('#conflict-box').inner_text()
  snapshot('conflict','#conflict-box')
  assert not page.evaluate('document.documentElement.scrollWidth > window.innerWidth'),f'conflict overflow {width}'
  click('#accept-alternative'); assert '2:00 left' in page.locator('#hold-status').inner_text()
  click('#revise-price');click('#primary-action')
  page.wait_for_selector('#accept-alternative')
  assert '£125.00' in page.locator('#conflict-box').inner_text(),page.locator('#conflict-box').inner_text()
  click('#accept-alternative')
  click('#consent');click('#primary-action')
  assert 'Submit synthetic booking' in page.locator('#primary-action').inner_text()
  with page.expect_response(lambda r: '/api/action' in r.url):page.locator('#guest-preference').select_option('quiet')
  page.wait_for_function('() => !document.getElementById("reset-demo").disabled')
  assert 'Validate latest evidence' in page.locator('#primary-action').inner_text()
  click('#primary-action');click('#primary-action')
  page.wait_for_selector('#settle-failed')
  click('#recover-receipt');click('#try-fulfill')
  assert 'NOT_SETTLED' in page.locator('#global-message').inner_text()
  click('#settle-failed');page.wait_for_selector('#exception-owner')
  assert 'Demo operations lead' in page.locator('#exception-owner').inner_text()
  click('#handoff-exception');
  assert 'Nothing' in page.locator('#global-message').inner_text() or 'No external' in page.locator('#global-message').inner_text()
  snapshot('exception','#outcome-panel')
  assert not page.evaluate('document.documentElement.scrollWidth > window.innerWidth'),f'exception overflow {width}'
  page.locator('#run-eval').click();page.wait_for_selector('.eval-summary')
  assert '0 failed' in page.locator('.eval-summary').inner_text(),page.locator('.eval-summary').inner_text()
  page.locator('.eval-case').first.locator('summary').click()
  snapshot('evidence','#eval-results')
  assert not page.evaluate('document.documentElement.scrollWidth > window.innerWidth'),f'eval overflow {width}'
  page.locator('#run-broken').click();page.wait_for_function('() => !document.getElementById("reset-demo").disabled')
  assert '0 failed' not in page.locator('.eval-summary').inner_text(),page.locator('.eval-summary').inner_text()
  results.append({'width':width,'horizontalOverflow':False,'workflow':'conflict + changed price + explicit accepted alternative + validation edit + submitted-not-settled block + failed settlement + owned handoff','eval':page.locator('.eval-summary').inner_text(),'consoleErrors':errors})
  assert not errors,errors
  context.close()
 browser.close()
print(json.dumps(results,indent=2))
open('work/ui/results.json','w').write(json.dumps(results,indent=2))
