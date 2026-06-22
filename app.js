/* ============================================================================
   FERPA Data to Reports,shared behaviors (loaded by every page)
   Tabbed code blocks, copy buttons, sidebar scrollspy, mobile contents toggle,
   in-page anchor scroll, per-section "revised N×" badges, and the
   Ask-the-assistant chat widget (Cloudflare Worker proxy -> published bot API).

   Per-page data (set in a small inline block BEFORE this script):
     window.PAGE_REVS        = { sectionId: count, ... }   // revised-badge counts
     window.PAGE_REV_DATE    = "Jun 21, 2026"              // revised-badge date
     window.ASKBOT_SUGGESTIONS = ["...", "..."]            // optional chat prompts
   The chat endpoints (EP / MODEL / BOT) are identical on every page and live here.
   ============================================================================ */
(function(){
  function ready(fn){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  /* a11y: one polite live region for transient announcements (e.g. "Copied"). */
  function announce(text){
    var live = document.getElementById('a11y-live');
    if(!live){
      live = document.createElement('div');
      live.id = 'a11y-live'; live.className = 'sr-only';
      live.setAttribute('aria-live', 'polite'); live.setAttribute('aria-atomic', 'true');
      document.body.appendChild(live);
    }
    live.textContent = ''; setTimeout(function(){ live.textContent = text; }, 30);
  }

  ready(function(){

    /* a11y (WCAG 2.1.1): horizontally-scrollable code blocks need keyboard access. */
    document.querySelectorAll('pre').forEach(function(p){
      if(!p.hasAttribute('tabindex')) p.setAttribute('tabindex', '0');
    });

    /* ── Tabbed code blocks ─────────────────────────────────────────────── */
    document.querySelectorAll('[data-codewrap]').forEach(function(wrap){
      var tabs = wrap.querySelectorAll('.tabs button[data-tab]');
      var panels = wrap.querySelectorAll('pre[data-panel]');
      tabs.forEach(function(btn){
        btn.addEventListener('click', function(){
          tabs.forEach(function(b){ b.classList.remove('active'); });
          btn.classList.add('active');
          panels.forEach(function(p){ p.hidden = (p.getAttribute('data-panel') !== btn.getAttribute('data-tab')); });
        });
      });
      var copyBtn = wrap.querySelector('[data-copy]');
      if(copyBtn){
        copyBtn.addEventListener('click', function(){
          var active = wrap.querySelector('pre[data-panel]:not([hidden])');
          if(!active) return;
          navigator.clipboard.writeText(active.innerText).then(function(){
            var t = copyBtn.textContent; copyBtn.textContent = 'Copied ✓'; announce('Copied to clipboard');
            setTimeout(function(){ copyBtn.textContent = t; }, 1400);
          });
        });
      }
    });

    /* ── Copy buttons on single code blocks ─────────────────────────────── */
    document.querySelectorAll('.codeblock').forEach(function(block){
      var code = block.querySelector('code'); if(!code) return;
      var btn = document.createElement('button');
      btn.className = 'cb-copy'; btn.type = 'button'; btn.textContent = 'Copy';
      btn.addEventListener('click', function(){
        navigator.clipboard.writeText(code.innerText).then(function(){
          var prev = btn.textContent; btn.textContent = 'Copied ✓'; announce('Copied to clipboard');
          setTimeout(function(){ btn.textContent = prev; }, 1400);
        });
      });
      block.appendChild(btn);
    });

    /* ── In-page anchor smooth-scroll (with header offset) ──────────────── */
    document.addEventListener('click', function(e){
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if(!a) return;
      var id = a.getAttribute('href').slice(1);
      var el = id && document.getElementById(id);
      if(!el) return;
      e.preventDefault();
      var top = el.getBoundingClientRect().top + window.scrollY - 8;
      window.scrollTo({ top: top, behavior: 'smooth' });
      if(history.replaceState) history.replaceState(null, '', '#' + id);
    });

    /* ── Scrollspy: highlight the active sidebar link ───────────────────── */
    var links = Array.prototype.slice.call(document.querySelectorAll('.sidebar nav a'));
    if(links.length){
      var map = {};
      links.forEach(function(a){ var id = a.getAttribute('href').slice(1); if(id) map[id] = a; });
      var sections = Object.keys(map).map(function(id){ return document.getElementById(id); }).filter(Boolean);
      var spy = new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          if(en.isIntersecting){
            links.forEach(function(a){ a.classList.remove('active'); });
            if(map[en.target.id]) map[en.target.id].classList.add('active');
          }
        });
      }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
      sections.forEach(function(s){ spy.observe(s); });
    }

    /* ── Mobile contents toggle ─────────────────────────────────────────── */
    var menuToggle = document.getElementById('menuToggle');
    var sidebar = document.getElementById('sidebar');
    if(menuToggle && sidebar){
      menuToggle.addEventListener('click', function(){
        var open = sidebar.classList.toggle('open');
        menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      sidebar.addEventListener('click', function(e){
        if(e.target.tagName === 'A' && window.innerWidth <= 900){
          sidebar.classList.remove('open');
          menuToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    /* ── Per-section "revised N×" badges (per-page data) ────────────────── */
    var revs = window.PAGE_REVS || {};
    var DATE = window.PAGE_REV_DATE || '';
    Object.keys(revs).forEach(function(id){
      var sec = document.getElementById(id); if(!sec) return;
      var h = sec.querySelector('h2'); if(!h) return;
      var b = document.createElement('span');
      b.className = 'revcount';
      b.title = 'Adjusted ' + revs[id] + ' times during the build (wording revisions, not content added); last revised ' + DATE + '.';
      b.innerHTML = '✎ revised ' + revs[id] + '× · ' + DATE;
      h.appendChild(b);
    });

    /* ── Ask-the-assistant chat widget ──────────────────────────────────── */
    (function(){
      var EP    = "https://ferpa-reports-bot-proxy.jonathan-engeln.workers.dev";
      var MODEL = "claude-v4.5-haiku";
      var BOT   = "https://llmsandbox.cloud.ucsb.edu/bot/01KVEPQV2NF2PVSBVMNW53NYA5";
      var convId = null, parentId = "system", busy = false;

      var toggle = document.getElementById('askbot-toggle');
      var panel  = document.getElementById('askbot-panel');
      var closeB = document.getElementById('askbot-close');
      var msgs   = document.getElementById('askbot-msgs');
      var form   = document.getElementById('askbot-form');
      var input  = document.getElementById('askbot-input');
      var send   = document.getElementById('askbot-send');
      if(!toggle) return;

      function openPanel(o){
        panel.hidden = !o;
        toggle.style.display = o ? 'none' : '';
        toggle.setAttribute('aria-expanded', o ? 'true' : 'false');
        if(o) setTimeout(function(){ input.focus(); }, 60);
        else toggle.focus();   /* a11y: return focus to the launcher */
      }
      toggle.addEventListener('click', function(){ openPanel(true); });
      closeB.addEventListener('click', function(){ openPanel(false); });
      /* a11y: Escape closes; Tab is trapped inside the open dialog. */
      panel.addEventListener('keydown', function(e){
        if(e.key === 'Escape'){ e.preventDefault(); openPanel(false); return; }
        if(e.key === 'Tab'){
          var f = panel.querySelectorAll('a[href],button:not([disabled]),input,textarea,[tabindex]:not([tabindex="-1"])');
          if(!f.length) return;
          var first = f[0], last = f[f.length - 1];
          if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
          else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
        }
      });

      function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
      function inline(s){
        s = esc(s);
        s = s.replace(/\[\^(\d+)\]/g, '<sup>[$1]</sup>');
        s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
        s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        s = s.replace(/\n{2,}/g, '<br><br>').replace(/\n/g, '<br>');
        return s;
      }
      function fmt(s){
        var parts = String(s).split(/```/), out = '';
        for(var i=0;i<parts.length;i++){
          if(i % 2 === 1){
            var code = parts[i].replace(/^[ \t]*[A-Za-z0-9_+\-]*\n/, '');
            out += '<pre><code>' + esc(code.replace(/\n+$/,'')) + '</code></pre>';
          } else {
            out += inline(parts[i]);
          }
        }
        return out;
      }
      function addMsg(text, who, isHtml){
        var d = document.createElement('div');
        d.className = 'askbot-msg ' + who;
        d.innerHTML = isHtml ? text : fmt(text);
        msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight;
      }
      function typing(on){
        var t = document.getElementById('askbot-t');
        if(on && !t){ t = document.createElement('div'); t.id='askbot-t'; t.className='askbot-typing'; t.textContent='thinking...'; msgs.appendChild(t); msgs.scrollTop = msgs.scrollHeight; }
        if(!on && t) t.remove();
      }
      function sleep(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }

      async function ask(text){
        busy = true; send.disabled = true; input.disabled = true; typing(true);
        try {
          var body = { message: { content:[{contentType:'text', body:text}], model:MODEL, role:'user', parentMessageId:parentId } };
          if(convId) body.conversationId = convId;
          var post = await fetch(EP + '/conversation', {
            method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
          });
          if(!post.ok) throw new Error('post ' + post.status);
          var pj = await post.json();
          convId = pj.conversationId; var userMid = pj.messageId;
          var reply = null;
          for(var i=0; i<25 && !reply; i++){
            await sleep(1200);
            var g = await fetch(EP + '/conversation/' + convId, { headers:{} });
            if(!g.ok) continue;
            var mm = (await g.json()).messageMap || {};
            for(var k in mm){
              var m = mm[k];
              if(m.role==='assistant' && m.parent===userMid && m.content && m.content[0] && m.content[0].body){
                reply = { id:k, body:m.content[0].body }; break;
              }
            }
          }
          typing(false);
          if(reply){ addMsg(reply.body, 'bot'); parentId = reply.id; }
          else { addMsg('That took longer than expected. Try again, or <a href="'+BOT+'" target="_blank" rel="noopener">open the full assistant</a>.', 'bot', true); }
        } catch(e){
          typing(false);
          addMsg('I could not reach the assistant from here. You can <a href="'+BOT+'" target="_blank" rel="noopener">open the full assistant in a new tab</a> instead.', 'bot', true);
        } finally {
          busy = false; send.disabled = false; input.disabled = false; input.focus();
        }
      }

      function submitText(t){
        if(!t || busy) return;
        addMsg(t, 'user'); input.value = '';
        var sg = document.getElementById('askbot-suggest'); if(sg) sg.remove();
        ask(t);
      }
      form.addEventListener('submit', function(e){
        e.preventDefault(); submitText(input.value.trim());
      });

      /* Optional per-page suggested questions, rendered as clickable chips. */
      var sugg = window.ASKBOT_SUGGESTIONS;
      if(sugg && sugg.length && form){
        var row = document.createElement('div');
        row.className = 'askbot-suggest'; row.id = 'askbot-suggest';
        sugg.forEach(function(q){
          var b = document.createElement('button');
          b.type = 'button'; b.textContent = q;
          b.addEventListener('click', function(){ submitText(q); });
          row.appendChild(b);
        });
        form.parentNode.insertBefore(row, form);
      }
    })();

  });
})();
