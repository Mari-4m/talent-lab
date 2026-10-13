/* Keep the existing script order, while waiting for private progress hydration. */
(async function () {
  const main = document.getElementById('main');
  const en = document.documentElement.lang === 'en';
  const say = (ka, english) => en ? english : ka;
  main.innerHTML = '<section class="panel" role="status">' + say('სასწავლო სივრცე იტვირთება…', 'Loading your learning space…') + '</section>';
  try { await window.TalentAccountReady; }
  catch {
    main.innerHTML = '<section class="panel"><h1>' + say('შესვლის შემოწმება ვერ დასრულდა', 'Could not check your sign-in') + '</h1><p>' + say('შეამოწმე ინტერნეტკავშირი და სცადე ხელახლა. შენი შენახული მონაცემები არ წაშლილა.', 'Check your connection and try again. Your saved data has not been deleted.') + '</p><button class="btn" id="account-boot-retry">' + say('ხელახლა ცდა', 'Retry') + '</button></section>';
    document.getElementById('account-boot-retry').onclick = () => location.reload();
    return;
  }
  const files = ['content','glossary','interview-data','tech-tests-data','quiz-improvements','english-course','english-glossary','english-interview','english-tests','locale-data','ui-language','preferences','app','practice','upgrades','boot','analytics','account'];
  for (const file of files) {
    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = file + '.js'; script.onload = resolve; script.onerror = reject;
        document.body.appendChild(script);
      });
    } catch {
      main.innerHTML = '<section class="panel"><p>' + say('გვერდი სრულად ვერ ჩაიტვირთა. განაახლე გვერდი და სცადე ხელახლა.', 'The page could not load completely. Refresh and try again.') + '</p><button class="btn" id="account-boot-retry">' + say('ხელახლა ცდა', 'Retry') + '</button></section>';
      document.getElementById('account-boot-retry').onclick = () => location.reload();
      return;
    }
  }
})();
