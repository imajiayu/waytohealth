// 合作伙伴邀约信（乌克兰语）—— 整封 HTML 作为静态模板，零变量
// 源文件：WayToHealth_Email_v2.html；base64 logo 已外置到 public/email/wth-logo.png
// 邮件客户端只能拉公网 URL，图片用绝对 https://waytohealth.org.ua/... 硬编码，不走 NEXT_PUBLIC_SITE_URL
// 因为 dev 环境那个值是 localhost:3000，真实收件人客户端打开时 localhost 不通

export const PARTNERSHIP_INVITE_UA_SUBJECT =
  `Партнерство, яке рятує життя — БФ «Шлях до здоров'я»`;

// 纯文本 fallback：当收件人客户端不支持 HTML 或被 spam filter 取纯文本时用
export const PARTNERSHIP_INVITE_UA_TEXT = `Благодійний фонд «Шлях до здоров'я»
Рятуємо сили та надію від війни

Вітаю!

Мене звати Єгор, я менеджер з розвитку Благодійного Фонду «Шлях до здоров'я» (м. Дніпро). Звертаємось до Вас із пропозицією розглянути можливість благодійного партнерства у сфері реабілітації осіб, постраждалих внаслідок збройної агресії проти України.

ПРО ФОНД

Фонд діє з 2022 року та забезпечує фінансування курсів реабілітації для військовослужбовців, ветеранів і цивільних осіб у медичному реабілітаційному центрі — безкоштовно для пацієнтів, за рахунок партнерської підтримки. За три роки роботи понад 1 500 осіб отримали необхідну допомогу. Фонд реалізує 11 напрямків, серед яких: фізична та психологічна реабілітація, VR-терапія, програми відновлення після ампутацій, підтримка дітей ветеранів та гуманітарна допомога.

ПАРТНЕРАМ ФОНДУ МИ ПРОПОНУЄМО

- Реальний КСВ-внесок з підтвердженим результатом
- Офіційний статус партнера з розміщенням у матеріалах фонду
- Регулярне висвітлення у соціальних мережах
- Можливість самостійно обрати напрямок підтримки
- Участь у спільних заходах

Будемо раді познайомитися ближче і розповісти більше про нашу роботу. Готові надіслати медіакит, відповісти на будь-які запитання та зустрітися — онлайн або особисто, як Вам зручніше.

Зв'язатися з нами: info@waytohealth.org.ua

З повагою, Єгор
Благодійний фонд «Шлях до здоров'я»

Тел.: +380 63 377 20 22
E-mail: info@waytohealth.org.ua
Web: https://www.waytohealth.org.ua/ua`;

export const PARTNERSHIP_INVITE_UA_HTML = `<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Партнерство, яке рятує життя — БФ «Шлях до здоров'я»</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Open+Sans:ital,wght@0,400;0,600;1,400&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#EEF4F8; font-family:'Open Sans',sans-serif; color:#1A1A1A; padding:32px 16px; }
  .wrapper { max-width:640px; margin:0 auto; }

  .header {
    background:#0D2D4A;
    border-radius:12px 12px 0 0;
    padding:28px 40px;
    display:flex;
    align-items:center;
    gap:24px;
  }
  .header img { width:114px; flex-shrink:0; }
  .header-text h1 {
    font-family:'Montserrat',sans-serif;
    font-size:18px; font-weight:700;
    color:#FFFFFF; letter-spacing:0.5px;
    line-height:1.3;
  }
  .header-text p { font-size:12px; color:#00A0B0; margin-top:6px; letter-spacing:0.4px; line-height:1.5; }

  .strip { background:#00A0B0; height:4px; }

  .body { background:#FFFFFF; padding:36px 40px 32px; }

  .subject-line {
    font-family:'Montserrat',sans-serif;
    font-size:14px; font-weight:700;
    color:#1A4F8A; letter-spacing:0.3px;
    margin-bottom:24px;
    padding-bottom:14px;
    border-bottom:1px solid #EEF4F8;
  }

  p.text { font-size:14px; line-height:1.8; color:#2A2A2A; margin-bottom:16px; }

  .section-label {
    font-family:'Montserrat',sans-serif;
    font-size:11px; font-weight:700;
    color:#FFFFFF; background:#1A4F8A;
    display:inline-block;
    padding:4px 12px; border-radius:3px;
    letter-spacing:1px; text-transform:uppercase;
    margin:24px 0 14px;
  }

  .offer-list { list-style:none; padding:0; margin-bottom:8px; }
  .offer-list li {
    font-size:14px; line-height:1.7; color:#2A2A2A;
    padding:9px 12px 9px 16px;
    border-left:3px solid #00A0B0;
    margin-bottom:6px;
    background:#F5FAFB;
    border-radius:0 4px 4px 0;
  }

  .cta-block {
    background:linear-gradient(135deg,#0D2D4A 0%,#1A4F8A 100%);
    border-radius:8px;
    padding:24px 28px;
    margin:28px 0 28px;
  }
  .cta-block p { font-size:14px; color:#C8DFF0; line-height:1.75; margin-bottom:16px; }
  .cta-btn {
    display:inline-block; background:#00A0B0; color:#FFFFFF;
    font-family:'Montserrat',sans-serif; font-size:13px; font-weight:600;
    padding:11px 28px; border-radius:5px; text-decoration:none; letter-spacing:0.5px;
  }

  hr.divider { border:none; border-top:1px solid #EEF4F8; margin:24px 0; }

  .sign p { font-size:14px; color:#2A2A2A; line-height:1.75; }
  .sign .name { font-family:'Montserrat',sans-serif; font-weight:700; color:#1A4F8A; font-size:15px; margin-top:6px; }
  .sign .role { font-size:12px; color:#5A7A8A; }

  .footer {
    background:#0D2D4A;
    border-radius:0 0 12px 12px;
    padding:20px 40px;
  }
  .footer-contacts { font-size:12px; color:#C8DFF0; line-height:2; }
  .footer-contacts a { color:#00A0B0; text-decoration:none; }
</style>
</head>
<body>
<div class="wrapper">

  <!-- HEADER -->
  <div class="header">
    <img src="https://waytohealth.org.ua/email/wth-logo.png" alt="Благодійний фонд «Шлях до здоров'я»" width="114">
    <div class="header-text">
      <h1>Благодійний фонд<br>«Шлях до здоров'я»</h1>
      <p>Рятуємо сили та надію від війни</p>
    </div>
  </div>
  <div class="strip"></div>

  <!-- BODY -->
  <div class="body">

    <div class="subject-line">Партнерство, яке рятує життя — БФ «Шлях до здоров'я»</div>

    <p class="text">Вітаю!</p>
    <p class="text">
      Мене звати Єгор, я менеджер з розвитку Благодійного Фонду «Шлях до здоров'я» (м. Дніпро).
      Звертаємось до Вас із пропозицією розглянути можливість благодійного партнерства у сфері
      реабілітації осіб, постраждалих внаслідок збройної агресії проти України.
    </p>

    <div class="section-label">Про фонд</div>

    <p class="text">
      Фонд діє з 2022 року та забезпечує фінансування курсів реабілітації для
      військовослужбовців, ветеранів і цивільних осіб у медичному реабілітаційному центрі —
      безкоштовно для пацієнтів, за рахунок партнерської підтримки. За три роки роботи
      понад 1&nbsp;500 осіб отримали необхідну допомогу. Фонд реалізує 11 напрямків, серед яких:
      фізична та психологічна реабілітація, VR-терапія, програми відновлення після ампутацій,
      підтримка дітей ветеранів та гуманітарна допомога.
    </p>

    <div class="section-label">Партнерам фонду ми пропонуємо</div>

    <ul class="offer-list">
      <li>Реальний КСВ-внесок з підтвердженим результатом</li>
      <li>Офіційний статус партнера з розміщенням у матеріалах фонду</li>
      <li>Регулярне висвітлення у соціальних мережах</li>
      <li>Можливість самостійно обрати напрямок підтримки</li>
      <li>Участь у спільних заходах</li>
    </ul>

    <div class="cta-block">
      <p>
        Будемо раді познайомитися ближче і розповісти більше про нашу роботу.
        Готові надіслати медіакит, відповісти на будь-які запитання та зустрітися —
        онлайн або особисто, як Вам зручніше.
      </p>
      <a href="mailto:info@waytohealth.org.ua" class="cta-btn">Зв'язатися з нами →</a>
    </div>

    <hr class="divider">

    <div class="sign">
      <p>З повагою, <span style="font-weight:600;">Єгор</span></p>
      <p class="name">Благодійний фонд «Шлях до здоров'я»</p>
    </div>

  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-contacts">
      📞 <a href="tel:+380633772022">+380 63 377 20 22</a><br>
      ✉️ <a href="mailto:info@waytohealth.org.ua">info@waytohealth.org.ua</a><br>
      🌐 <a href="https://www.waytohealth.org.ua/ua">waytohealth.org.ua</a>
    </div>
  </div>

</div>
</body>
</html>`;
