# Talent Lab

A colourful bilingual (Georgian / English) learning space for HR foundations and technical recruiting. Includes 24 lessons, knowledge checks, a 622-term glossary, interview practice, sourcing tools and a final recruiting plan. Light and dark themes and learning progress are stored in the browser.

## Run locally

No build step or package installation is required. From this folder run:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. A local web server is recommended over opening `index.html` directly, so browser storage behaves consistently.

## GitHub Pages

1. Upload **all files from this folder** to the root of your repository. Keep the existing repository; replace files with the same names.
2. In **Settings → Pages**, select **Deploy from a branch**, **main**, **/(root)**, then save.
3. Commit the files and wait for the Pages deployment to finish. If a previous version is cached, refresh the page.

Relative asset links and hash routes work at a GitHub Pages project URL. `.nojekyll` is included. No GitHub token, server, database or environment variables are required.

## Personal data and progress

Progress, notes, bookmarks, practice history, language and theme settings stay in localStorage on the current browser and site origin. Changing languages preserves them. Changing domains, clearing browser data, private browsing or switching devices may create a separate progress record. Export progress and plans for a personal copy. Exports are not a restore/import feature.

There is no sign-in or shared learner database. Client-side lesson gates organise study; they are not security controls. No candidate database is uploaded. The placement check unlocks technical recruiting at 5/6 without marking HR lessons completed or adding XP. Course checks require 3/3; practice rounds have no XP.

## Content and maintenance

Georgian and English lessons are original educational guides. External articles, courses, documentation and interview methodology remain on their publishers’ websites; links do not grant access to paid resources. Lesson quizzes and interview examples are original learning material. Learning badges and scores are not professional certification.

Edit `content.js` / `english-course.js` for lessons, `glossary.js` / `english-glossary.js` for definitions, the interview and test data files for practice, and `ui-language.js` for interface translations. Keep stable IDs to preserve saved progress. Review access terms and link availability periodically.

## License

The code and original Talent Lab learning guides are available under the MIT License in `LICENSE`. External resources, names and trademarks remain subject to their owners’ terms. The MIT License does not relicense linked third-party material.

---

## ქართულად

Talent Lab ორენოვანი სასწავლო სივრცეა: 24 გაკვეთილი, ცოდნის ტესტები, 622 ტერმინი, ინტერვიუს პრაქტიკა და საბოლოო recruiting გეგმა.

**GitHub-ზე განახლება:** ატვირთე ამ საქაღალდის ყველა ფაილი შენი რეპოზიტორიის მთავარ დონეზე, შეცვალე იგივე სახელის ფაილები და დააჭირე **Commit changes**. Pages-ის პარამეტრები: **main → /(root)**. ZIP თავად არ ატვირთო; ჯერ გახსენი და შიგნით არსებული ფაილები ატვირთე.

ენა და მუქი/ნათელი რეჟიმი ზედა მარჯვენა კუთხიდან იცვლება. პროგრესი ენის გადართვისას შენარჩუნდება; სხვადასხვა ბრაუზერსა და დომენზე ჩანაწერები ცალკეა. ანგარიში და გეგმები ჩამოტვირთე პერსონალური ასლისთვის. ავტორიზაცია და სერვერი ამ ვერსიას არ აქვს.

კოდი და Talent Lab-ის ავტორული სასწავლო მასალა MIT ლიცენზიით ვრცელდება. გარე რესურსების შინაარსზე მათი მფლობელების პირობები მოქმედებს.

## Central analytics and ratings

`analytics.js` sends anonymous learning events and submitted star ratings to the separate Talent Lab analytics service. GitHub Pages continues hosting only static files. Uploading the frontend ZIP does not deploy the backend; the analytics service must remain available at its configured `ANALYTICS_BASE` URL.

Use **Admin sign-in** in the footer to open the protected dashboard and sign in with the same ChatGPT account that owns Talent Lab. Only the configured owner account can access detailed analytics, comments, exports or public-visibility settings. Visitors do not need an account to study or rate the platform.

The owner can independently publish total visitor count, average stars and rating count, total completed lessons, and the three most popular lessons. All switches start off. Public counts are based on real recorded data; empty metrics are hidden.

Visits are anonymous browser identifiers, not verified unique people. Analytics begins after installing this version; earlier page views cannot be recovered. Previously saved completed lessons may be synchronised and identified as existing progress. Ratings can be updated from the same browser. An optional comment remains owner-only.

The frontend sends only route/module IDs, quiz scores, completed lesson IDs, active-time estimates, language, coarse device type and referrer hostname. Names, emails, local notes, custom-resource contents, candidate details, full URLs and search terms are excluded. Visitors can turn off future activity collection in **Analytics preferences**. Privacy signals supported by the browser disable collection by default. Star rating submission is a separate explicit action.
