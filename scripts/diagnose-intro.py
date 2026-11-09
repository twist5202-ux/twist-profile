from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
import json
srv=ThreadingHTTPServer(("127.0.0.1",18783),SimpleHTTPRequestHandler)
Thread(target=srv.serve_forever,daemon=True).start()
url="http://127.0.0.1:18783/index.html"
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=["--no-sandbox"])
    for mode in ["no-preference","reduce"]:
        page=browser.new_page(viewport={"width":1365,"height":768})
        page.emulate_media(reduced_motion=mode)
        errors=[]
        page.on("pageerror",lambda err:errors.append(str(err)))
        page.goto(url,wait_until="domcontentloaded",timeout=60000)
        initial=page.evaluate("""() => ({
          html:document.documentElement.className,
          button:document.getElementById('motion').textContent,
          active:document.getElementById('motion').getAttribute('aria-pressed'),
          halo:getComputedStyle(document.querySelector('.v6-halo')).animationName
        })""")
        page.wait_for_timeout(1050)
        first=page.evaluate("""() => ({
          loading:document.body.classList.contains('loading'),
          progress:document.querySelector('#percentage').textContent,
          letters:[...document.querySelectorAll('.v7-glyph')].filter(e=>e.classList.contains('v7-visible')).length
        })""")
        page.wait_for_timeout(1400)
        second=page.evaluate("""() => ({
          progress:document.querySelector('#percentage').textContent,
          letters:[...document.querySelectorAll('.v7-glyph')].filter(e=>e.classList.contains('v7-visible')).length
        })""")
        assert initial["active"]=="true" and "ON" in initial["button"],(mode,initial)
        assert initial["halo"]!="none",(mode,initial)
        assert first["letters"]>=1,(mode,first)
        assert second["letters"]>first["letters"],(mode,first,second)
        page.wait_for_timeout(3700)
        assert page.evaluate("document.body.classList.contains('ready')"),mode
        page.locator("#replayIntro").click()
        page.wait_for_timeout(1150)
        replay=page.evaluate("""() => ({
          progress:document.querySelector('#percentage').textContent,
          letters:[...document.querySelectorAll('.v7-glyph')].filter(e=>e.classList.contains('v7-visible')).length
        })""")
        assert 1<=replay["letters"]<=5,(mode,replay)
        page.locator('#skip').click()
        page.wait_for_timeout(1200)
        page.locator("#motion").click()
        off=page.evaluate("""() => ({
          active:document.getElementById('motion').getAttribute('aria-pressed'),
          body:document.body.className
        })""")
        assert off["active"]=="false" and "motion-off" in off["body"],(mode,off)
        page.locator("#motion").click()
        on=page.evaluate("""() => ({
          active:document.getElementById('motion').getAttribute('aria-pressed'),
          halo:getComputedStyle(document.querySelector('.v6-halo')).animationName
        })""")
        assert on["active"]=="true" and on["halo"]!="none",(mode,on)
        assert not errors,(mode,errors)
        print("PASS",mode,json.dumps({"initial":initial,"first":first,"second":second,"replay":replay,"off":off,"on":on,"errors":errors}),flush=True)
        page.close()
    browser.close()
srv.shutdown()
