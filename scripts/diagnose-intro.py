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
        page.wait_for_timeout(2300)
        mid=page.evaluate("""() => ({
            progress:document.querySelector('#percentage').textContent,
            revealed:[...document.querySelectorAll('.v7-glyph')].filter(e=>e.classList.contains('v7-visible')).length,
            hasMotionCSS:getComputedStyle(document.querySelector('.v6-halo')).animationName,
            button:document.querySelector('#motion').textContent,
            prefersReduced:matchMedia('(prefers-reduced-motion:reduce)').matches
        })""")
        page.wait_for_timeout(4200)
        later=page.evaluate("""() => ({
            body:document.body.className,
            progress:document.querySelector('#percentage').textContent,
            loaderOpacity:getComputedStyle(document.querySelector('#loader')).opacity
        })""")
        if mode=="reduce":
            page.locator("#motion").click()
            page.wait_for_timeout(2700)
            override=page.evaluate("""() => ({
                htmlClass:document.documentElement.className,
                body:document.body.className,
                haloAnimation:getComputedStyle(document.querySelector('.v6-halo')).animationName,
                progress:document.querySelector('#percentage').textContent,
                loaderVisible:getComputedStyle(document.querySelector('#loader')).visibility,
                activeLetters:[...document.querySelectorAll('.v7-glyph')].filter(e=>e.classList.contains('v7-visible')).length,
                motionButton:document.querySelector('#motion').textContent
            })""")
            assert "force-motion" in override["htmlClass"], override
            assert override["haloAnimation"]!="none",override
            assert override["motionButton"].strip().endswith("ON"),override
            print("OVERRIDE",json.dumps(override))
        else:
            page.locator("#replayIntro").click()
            page.wait_for_timeout(1100)
            replay=page.evaluate("""() => ({
              loader:document.querySelector('#loader').className,
              progress:document.querySelector('#percentage').textContent,
              letters:[...document.querySelectorAll('.v7-glyph')].filter(e=>e.classList.contains('v7-visible')).length,
            })""")
            assert replay["letters"]>=1 and replay["letters"]<=5,replay
            print("REPLAY",json.dumps(replay))
        assert mid["revealed"]>1,mid
        assert later["progress"]=="100%",later
        assert len(errors)==0,errors
        print("TEST",mode,"MID",json.dumps(mid),"END",json.dumps(later),"ERRORS",json.dumps(errors))
        page.close()
    browser.close()
srv.shutdown()
