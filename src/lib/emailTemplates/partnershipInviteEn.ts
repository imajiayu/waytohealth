// Partnership invitation letter (English) - entire HTML as a static template, zero variables
// Source file: WayToHealth_Email_v2.html; base64 logo has been externalized to public/email/wth-logo-en.png
// Email clients can only fetch public URLs, so the image uses an absolute hardcoded https://waytohealth.org.ua/... URL
// We do not use NEXT_PUBLIC_SITE_URL because in dev it is localhost:3000, which is unreachable for real recipients

export const PARTNERSHIP_INVITE_EN_SUBJECT =
  `A Partnership That Saves Lives - Way to Health Charity Foundation`;

// Plain-text fallback: used when the recipient's client does not support HTML or a spam filter extracts plain text only
export const PARTNERSHIP_INVITE_EN_TEXT = `Way to Health Charity Foundation
Restoring strength and hope to those affected by war

Hello!

My name is Yehor, and I am a development manager at the Way to Health Charity Foundation (Dnipro). We are reaching out to invite you to consider a charitable partnership in the field of rehabilitation for people affected by the armed aggression against Ukraine.

ABOUT THE FOUNDATION

The foundation has been operating since 2022 and provides funding for rehabilitation courses for service members, veterans, and civilians at a medical rehabilitation center - free of charge for patients, thanks to partner support. Over three years of work, more than 1,500 people have received the help they needed. The foundation implements 11 areas of support, including physical and psychological rehabilitation, VR therapy, recovery programs after amputations, support for veterans' children, and humanitarian aid.

WHAT WE OFFER OUR PARTNERS

- A real CSR contribution with measurable impact
- Official partner status with placement in the foundation's materials
- Regular coverage on social media
- The opportunity to choose the area of support yourself
- Participation in joint events

We would be glad to get acquainted and tell you more about our work. We are ready to send a media kit, answer any questions, and arrange a meeting - online or in person, whichever is more convenient for you.

Contact us: info@waytohealth.org.ua

Sincerely, Yehor
Way to Health Charity Foundation

Tel.: +380 63 377 20 22
E-mail: info@waytohealth.org.ua
Web: https://www.waytohealth.org.ua/en`;

export const PARTNERSHIP_INVITE_EN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>A Partnership That Saves Lives - Way to Health Charity Foundation</title>
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
  .header img { width:136px; flex-shrink:0; }
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
    <img src="https://waytohealth.org.ua/email/wth-logo-en.png" alt="Way to Health Charity Foundation" width="136">
    <div class="header-text">
      <h1>Way to Health<br>Charity Foundation</h1>
      <p>Restoring strength and hope to those affected by war</p>
    </div>
  </div>
  <div class="strip"></div>

  <!-- BODY -->
  <div class="body">

    <div class="subject-line">A Partnership That Saves Lives - Way to Health Charity Foundation</div>

    <p class="text">Hello!</p>
    <p class="text">
      My name is Yehor, and I am a development manager at the Way to Health Charity Foundation (Dnipro).
      We are reaching out to invite you to consider a charitable partnership in the field of
      rehabilitation for people affected by the armed aggression against Ukraine.
    </p>

    <div class="section-label">About the foundation</div>

    <p class="text">
      The foundation has been operating since 2022 and provides funding for rehabilitation courses for
      service members, veterans, and civilians at a medical rehabilitation center -
      free of charge for patients, thanks to partner support. Over three years of work,
      more than 1&nbsp;500 people have received the help they needed. The foundation implements 11 areas of support,
      including physical and psychological rehabilitation, VR therapy, recovery programs after amputations,
      support for veterans' children, and humanitarian aid.
    </p>

    <div class="section-label">What we offer our partners</div>

    <ul class="offer-list">
      <li>A real CSR contribution with measurable impact</li>
      <li>Official partner status with placement in the foundation's materials</li>
      <li>Regular coverage on social media</li>
      <li>The opportunity to choose the area of support yourself</li>
      <li>Participation in joint events</li>
    </ul>

    <div class="cta-block">
      <p>
        We would be glad to get acquainted and tell you more about our work.
        We are ready to send a media kit, answer any questions, and arrange a meeting -
        online or in person, whichever is more convenient for you.
      </p>
      <a href="mailto:info@waytohealth.org.ua" class="cta-btn">Contact us →</a>
    </div>

    <hr class="divider">

    <div class="sign">
      <p>Sincerely, <span style="font-weight:600;">Yehor</span></p>
      <p class="name">Way to Health Charity Foundation</p>
    </div>

  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-contacts">
      📞 <a href="tel:+380633772022">+380 63 377 20 22</a><br>
      ✉️ <a href="mailto:info@waytohealth.org.ua">info@waytohealth.org.ua</a><br>
      🌐 <a href="https://www.waytohealth.org.ua/en">waytohealth.org.ua</a>
    </div>
  </div>

</div>
</body>
</html>`;
