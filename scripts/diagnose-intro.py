from playwright.sync_api import sync_playwright
import json
url='https://twist5202-ux.github.io/twist-profile/?diag=20261109'
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1365,'height':768},device_scale_factor=1)
    errors=[]
    page.on("pageerror",lambda e:errors.append("PAGEERROR "+str(e)))
    page.on("console",lambda m:errors.append("CONSOLE "+m.type+" "+m.text) if m.type=='error' else None)
    page.on("requestfailed",lambda r:errors.append("FAILED "+r.url+" "+str(r.failure)))
    page.goto(url,wait_until='domcontentloaded',timeout=60000)
    for ms in [500,2100,5900,7700]:
        page.wait_for_timeout(ms-(0 if ms==500 else {2100:500,5900:2100,7700:5900}[ms]))
        print("AT",ms,json.dumps(page.evaluate("""() => ({
            url: location.href, ready:document.readyState,
            bodyClass:document.body.className,
            loaderClass:document.getElementById('loader')?.className,
            loaderOpacity:getComputedStyle(document.getElementById('loader')).opacity,
            progress:document.getElementById('percentage')?.textContent,
            shownLetters:[...document.querySelectorAll('.v7-glyph')].map(e=>e.classList.contains('v7-visible')),
            motionOn:getComputedStyle(document.querySelector('.v7-glyph')).animationName,
            cssAnimation:getComputedStyle(document.querySelector('.v6-halo')).animationName,
            mediaReduce:matchMedia('(prefers-reduced-motion: reduce)').matches,
            audioButton:document.getElementById('twistSoundToggle')?.textContent
        })""")))
    page.locator('#replayIntro').click()
    page.wait_for_timeout(2600)
    print("REPLAY",json.dumps(page.evaluate("""() => ({
      progress:document.getElementById('percentage')?.textContent,
      shownLetters:[...document.querySelectorAll('.v7-glyph')].map(e=>e.classList.contains('v7-visible')),
      loader:document.querySelector('#loader')?.className,
      loading:document.body.className
    })""")))
    print("ERRORS",json.dumps(errors))
    b.close()
