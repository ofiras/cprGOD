// content.js

const ShowSummaryButton = true;

(async () => {
    const src = chrome.runtime.getURL("build/pdf.mjs");
    const pdfjsLib = await import(src);
    pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('build/pdf.worker.mjs');
    //  heading = await getHeading();

})();

var isThereAlisteningEvent = false;
var lastFormattedText = "";

var heading = '';

getHeading().then(heading2 => {
    heading = heading2;
    console.log(heading2); // Logs the heading
}).catch(error => {
    console.error(error); // Logs any error that occurred
});


const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.id = 'fileInput';
fileInput.accept = "application/pdf";


const fileUploader = document.createElement('div');
fileUploader.className = "MuiPaper-root MuiPaper-elevation MuiPaper-rounded MuiPaper-elevation1 MuiAccordion-root MuiAccordion-rounded MuiAccordion-gutters css-pp0juj";
fileUploader.id = 'cprGOD';
fileUploader.appendChild(fileInput);
//fileUploader.appendChild(uploadButton);

// Style the file uploader
fileUploader.style.display = 'flex';
fileUploader.style.flexDirection = 'column';
fileUploader.style.justifyContent = 'center';
fileUploader.style.alignItems = 'center';
fileUploader.style.height = '70px';

// Create a label for the file input to style it
const fileInputLabel = document.createElement('label');
fileInputLabel.className = "file-input-label";
fileInputLabel.htmlFor = 'fileInput';
fileInputLabel.innerText = 'בחר קובץ סיכום';

// Style the file input
fileInput.style.display = 'none';

// Style the label
fileInputLabel.style.display = 'inline-block';
fileInputLabel.style.padding = '10px 20px';
fileInputLabel.style.background = '#d8e3f2'; // Blue background
fileInputLabel.style.color = '#017bff';
fileInputLabel.style.fontFamily = 'Ariel';
fileInputLabel.style.cursor = 'pointer';
fileInputLabel.style.borderRadius = '50px'; // Round corners

const statusLabel = document.createElement('label');
statusLabel.innerText = 'מוכן';

// Style the status label
statusLabel.style.display = 'block';
statusLabel.style.textAlign = 'center';
statusLabel.className = "MuiTypography-root MuiTypography-body1 css-1fzf3y1";
statusLabel.id = 'statusLabelcprGOD';


// Create a new button
const summaryButton = document.createElement('button');
summaryButton.innerText = 'סכם בשבילי';

// Style the button
summaryButton.style.display = 'inline-block';
summaryButton.style.padding = '10px 20px';
summaryButton.style.background = '#d8e3f2'; // Blue background
summaryButton.style.color = '#017bff';
summaryButton.style.fontFamily = 'Ariel';
summaryButton.style.cursor = 'pointer';
summaryButton.style.borderRadius = '50px'; // Round corners
summaryButton.style.border = 'none'; // No outline
summaryButton.style.marginRight = '10px'; // Add some space between the button and the label

// Add an event listener to the button
summaryButton.addEventListener('click', insertSummary);


// Create a table and a row
const table = document.createElement('table');
const row = document.createElement('tr');

// Create a cell for the button
const buttonCell = document.createElement('td');
buttonCell.appendChild(fileInputLabel);

// Create a cell for the file input label
const fileInputCell = document.createElement('td');

// Check if ShowSummaryButton is true
if (ShowSummaryButton) {
    fileInputCell.appendChild(summaryButton);
}


// Append the cells to the row
row.appendChild(buttonCell);
row.appendChild(fileInputCell);

// Append the row to the table
table.appendChild(row);

// Append the table to the file uploader
fileUploader.appendChild(table);


// Append the file input to the label
fileInputLabel.appendChild(fileInput);



fileUploader.appendChild(statusLabel);

fileInput.addEventListener('change', handleFileChange);


var currentPatientId = 0;

// document.body.appendChild(fileUploader);
//waitForElementToExist('#medical-visit-details').then(element =>  {
waitForElementToExist('#medical-visit-details').then(handleVisitDetailsElement);
isThereAlisteningEvent = true;

function handleVisitDetailsElement() {

    const rootElement = document.getElementById('root').getElementsByTagName('div')[0];
    const visitDetailsElement = document.getElementById('medical-visit-details');
    rootElement.insertBefore(fileUploader, visitDetailsElement);
    console.log("working");


    const patientDetailsElement = document.getElementsByClassName('MuiGrid-root css-vvv6ef')[0];
    const patientIdElement = findElementByText('ת.ז', patientDetailsElement);

    const parentDiv = patientIdElement.parentElement;
    const pElements = parentDiv.querySelectorAll('p');


    if (pElements.length >= 2) {
        var patientIdNum = pElements[1].textContent.trim();
    } else {
        console.error('The parent div does not contain at least two p elements.');
        var patientIdNum = null;
    }

    if (isNaN(patientIdNum)) {
        alert("שגיאה בקריאת תעודת הזהות של המטופל. לא ניתן להשתמש בתוסף כעת.");
        return;
    }
    else {
        currentPatientId = parseInt(patientIdNum);
    }


    rootElement.insertBefore(fileUploader, visitDetailsElement);


    isThereAlisteningEvent = false;

};


function handleFileChange(e) {
    let FullTextContent = "";
    statusLabel.innerText = 'מעבד...';
    console.log("strat");

    var file = e.target.files[0];
    if (file.type != "application/pdf") {
        console.error(file.name, "נא להכניס קובץ PDF בלבד")
        statusLabel.innerText = 'נא להכניס קובץ PDF בלבד';

        return
    }

    var fileReader = new FileReader();
    fileReader.onload = function () {
        var typedarray = new Uint8Array(this.result);

        window.pdfjsLib.getDocument(typedarray).promise.then(function (pdf) {
            var numPages = pdf.numPages;
            var currentPage = 1;

            function getPageText(pageNum) {
                pdf.getPage(pageNum).then(function (page) {
                    page.getTextContent().then(function (textContent) {
                        if (textContent.items.length > 0) {
                            textContent.items.sort((a, b) => {
                                if (b.transform[5] - a.transform[5] !== 0) {
                                    return b.transform[5] - a.transform[5];
                                } else {
                                    return a.transform[4] - b.transform[4];
                                }
                            });

                            var lastY = textContent.items[0].transform[5];
                            var lastX = textContent.items[0].transform[4] + textContent.items[0].width; // Track the end position of the last item
                            var lastHeight = textContent.items[0].height;
                            var textItems = [];
                            for (var i = 0; i < textContent.items.length; i++) {
                                var item = textContent.items[i];
                                var newY = item.transform[5];
                                var newX = item.transform[4]; // This is the start position of the current item
                                if (newY !== lastY) {
                                    if (/[\u0590-\u05FF]/.test(textItems.join(''))) {
                                        textItems.reverse();
                                    }
                                    FullTextContent += textItems.join('') + '\n';
                                    textItems = [];
                                } else if (newX - lastX > 1.5 * item.width) { // Compare the start position of the current item with the end position of the last item
                                    textItems.push(' ');
                                }
                                var textChunk = item.str.split('').map(char => {
                                    if (char.charCodeAt(0) === 173 || char === '\u2013') {
                                        return '-';
                                    }
                                    return char;
                                }).join('');
                                textItems.push(textChunk);
                                lastY = newY;
                                lastX = newX + item.width; // Update the end position of the last item
                                lastHeight = item.height;
                            }
                            if (/[\u0590-\u05FF]/.test(textItems.join(''))) {
                                textItems.reverse();
                            }
                            FullTextContent += textItems.join('') + '\n';
                        }

                        if (currentPage < numPages) {
                            currentPage++;
                            getPageText(currentPage);
                        } else {
                            //  document.getElementById('anamnesis').click();
                            FullTextContent = FullTextContent.split('').map(char => char.charCodeAt(0) === 173 ? '-' : char).join('');
                            // var FormattedText = FullTextContent;
                            var FormattedText = formatData(FullTextContent);
                            console.log("textContent: ", FullTextContent);
                            lastFormattedText = FormattedText;
                            if (FormattedText == null) return;



                            // All pages have been processed, set the textarea value
                            var anamnesisDiv = document.querySelector('#anamnesis');
                            var textarea1 = anamnesisDiv.querySelector('textarea:first-of-type');

                            var findingsDiv = document.querySelector('#findings');
                            var textarea2 = findingsDiv.querySelector('textarea:first-of-type');

                            var discussionDiv = document.querySelector('#discussion-and-plan');
                            var textarea3 = discussionDiv.querySelector('textarea:first-of-type');

                            textarea1.value = " ";
                            textarea2.value = " ";
                            textarea3.value = " ";

                            if (FormattedText && FormattedText.length > 3900) {
                                var lastSpaceBefore4000 = FormattedText.lastIndexOf(' ', 3900);
                                var textForTextarea2 = FormattedText.substring(lastSpaceBefore4000).trim();

                                if (textForTextarea2.length > 3400) {
                                    var lastSpaceBefore3500 = textForTextarea2.lastIndexOf(' ', 3400);
                                    textarea2.value = textForTextarea2.substring(0, lastSpaceBefore3500);
                                    var textForTextarea3 = textForTextarea2.substring(lastSpaceBefore3500).trim();

                                    if (textForTextarea3.length > 3900) {
                                        var lastSpaceBefore3900 = textForTextarea3.lastIndexOf(' ', 3900);
                                        textarea3.value = textForTextarea3.substring(0, lastSpaceBefore3900);
                                        alert("לא הכנסנו את כל הטקסט מהסיכום כיוון שהוא היה ארוך מדי. אנא בדוק את הטקסט שהוכנס והוסף את החסר באופן ידני במפגש נפרד.");
                                    } else {
                                        textarea3.value = textForTextarea3;
                                    }
                                } else {
                                    textarea2.value = textForTextarea2;
                                }

                                textarea1.value = FormattedText.substring(0, lastSpaceBefore4000);
                            } else {
                                textarea1.value = FormattedText;
                            }

                            FullTextContent = "";
                            FormattedText = "";

                            // Create a new 'input' event
                            var event1 = new Event('input', {
                                bubbles: true,
                                cancelable: true,
                            });

                            // Dispatch the event
                            textarea1.dispatchEvent(event1);

                            if (textarea2.value) {
                                var event2 = new Event('input', {
                                    bubbles: true,
                                    cancelable: true,
                                });

                                textarea2.dispatchEvent(event2);
                            }

                            if (textarea3.value) {
                                var event3 = new Event('input', {
                                    bubbles: true,
                                    cancelable: true,
                                });

                                textarea3.dispatchEvent(event3);
                            }
                            statusLabel.innerText = 'הוזן בהצלחה. יש לוודא שהטקסט הועתק במלואו ובאופן תקין';

                        }
                    });
                });
            }

            getPageText(currentPage);
        });
    };
    fileReader.readAsArrayBuffer(file);

    //  console.log("textContent: ", FullTextContent);
};




function getNameAndId(text) {


    let hospitalMatch = text.match(/דואר אלקטרוני:\nMALRADSOR@CLALIT.ORG.IL/);
    let hospital = text.startsWith("סורוקה מרכז") || (hospitalMatch && hospitalMatch.index >= 0)
        ? "סורוקה"
        : (text.match(/\*\*\*חסוי רפואי\*\*\*(?:\nמדינת ישראל The State of Israel\nהמרכז הרפואי אסותא אשדוד ע"ש סמסון Samson Assuta Ashdod medical center\n7 Harefuah St. Ashdod)?/)
            ? "אסותא אשדוד"
            : (text.match(/המרכז הרפואי האוניברסיטאי ברזילי\r?\nרחוב ההסתדרות 2 ,מיקוד 7830604 ,אשקלון/)
                ? "ברזילי"
                : null));


    if (!hospital) {
        statusLabel.innerText = 'שגיאה';
        alert("נראה שזה פורמט קובץ שאנחנו לא מכירים, אולי מבית חולים שלא נוסף לתוסף. אנא שלחו את הקובץ לכתובת המייל ofiasu@gmail.com וצרו קשר עם אופיר אסולין.");
        return { ToContinue: false };
    }

    var typeOfFile = "";
    var nameRegex;
    var lastNameRegex;
    var idRegex;
    var registryNumberRegex;
    var entryDateRegex;
    var releaseDateRegex;
    var entryTimeRegex;
    var wardRegex;
    var diagnosisRegex;
    var complaintRegex;
    var currentDiseaseRegex;
    var erProgressionRegex = "";
    var physicalExamRegex;
    var discussionRegex;
    var recommendationsRegex;
    var doctorRegex;
    var additionalInfoRegex;
    var licenseRegex;
    let namesRegex

    // ==================================================== סורוקה ================================================


    if (hospital == "סורוקה") {


        let isFirstMatch = true;
        text = text.replace(/\r?\nPage \d+ of \d+[\s\S]*?מס' קבלה למחלקה: \d+\r?\n/g, (match) => {
            //      if (isFirstMatch && match.includes("Page 1 of")) {
            //          isFirstMatch = false;
            //         return match; // return the original match for the first occurrence
            //     }
            return '\n'; // return an empty string for all other occurrences
        });


        text = text.replace(/Page \d+ of \d+/g, '');
        text = text.replace(/פרטיםנרשם ע"ינושאתאריך ושעה\r?\n/, '');

        // console.log("after clean: " + text);


        nameRegex = /(?:שם פרטי: |\r?\nשם פרטי: )(.*?)(?:ת\. זהות:|\r?\nכתובת:)/s;

        //check if it is a hospitalisation relese

        if (text.indexOf("סיכום שחרור רפואי") >= 0 && text.match(nameRegex).index > text.indexOf("סיכום שחרור רפואי")) {
            typeOfFile = "סיכום שחרור מאשפוז";
        }
        else if ((text.indexOf("מכתב סיכום רפואי שחרור מהמלרד") >= 0 && text.match(nameRegex).index > text.indexOf("מכתב סיכום רפואי שחרור מהמלרד")) || (text.indexOf("מכתב סיכום רפואי עיניים שחרור מיון עיניים") >= 0 && text.match(nameRegex).index > text.indexOf("מכתב סיכום רפואי עיניים שחרור מיון עיניים"))) {
            typeOfFile = "סיכום שחרור ממיון";
        }
        console.log("--" + typeOfFile);


        lastNameRegex = /שם משפחה: (.*?)(?:ת\. לידה:|\r?\nשם פרטי:)/s;
        idRegex = /(?:ת\. זהות: |\r?\nתעודת זהות: )(\d+)/;
        registryNumberRegex = /\r?\n(?:מס' קבלה למחלקה: |מספר ביקור: )(\d+)/;
        entryDateRegex = /(?:תאריך כניסה למחלקה |\r?\nתאריך ביקור: )(\d{2}\/\d{2}\/\d{4})/;
        releaseDateRegex = /תאריך שחרור מהמחלקה (\d{2}\/\d{2}\/\d{4})/;
        entryTimeRegex = /\r?\nשעת קבלה למלר"ד: (\d{2}:\d{2})/;
        wardRegex = /\r?\n(?:סיכום שחרור רפואי עם חתימה דיגיטלית|סיכום שחרור רפואי)\r?\n(.*?)\r?\n/s;
        currentDiseaseRegex = /\r?\n(?:מחלה נוכחית|תלונה עיקרית ומחלה נוכחית)\r?\n([\s\S]*?)\r?\n(?:מדדים בקבלה|בדיקה גופנית בקבלה|תוצאות בדיקות עזר|מדדים)\r?\n/s;
        physicalExamRegex = /\r?\nבדיקה גופנית בקבלה\r?\n([\s\S]*?)\r?\n(?:תוצאות בדיקות עזר|תוצאות מעבדה|יעוצים|בדיקות עזר ברכיב|מהלך ודיון)\r?\n/s;
        if (typeOfFile == "סיכום שחרור ממיון") {
            diagnosisRegex = /\r?\nאבחנה\r?\n([\s\S]*?)\r?\n(?:תלונה עיקרית ומחלה נוכחית)\r?\n/;
            erProgressionRegex = /\nמהלך ודיון\n([\s\S]*?)\n(?:יעוצים|תוצאות מעבדה)\n/;
            complaintRegex = /\r?\n(?:תלונת החולה \/ תלונה עקרית|תלונה עקרית|סיבת הפניה בקבלה|סיבת הביקור)\r?\n([\s\S]*?)\r?\n(?:מחלה נוכחית|חדות ראיה|בדיקת עיניים)\r?\n/s;
            discussionRegex = /\r?\n(?:סיכום|סיכום והמלצות)\r?\n([\s\S]*?)\r?\n(?:המלצות|תוצאות מעבדה|חתימה דיגיטלית)\r?\n/s;
            additionalInfoRegex = /\r?\nיעוצים\r?\n([\s\S]*?)\r?\nסיכום\r?\n/s;
        }
        else {
            diagnosisRegex = /\r?\nאבחנות בשחרור\r?\n([\s\S]*?)\r?\n(?:מחלות רקע|תלונה עקרית|מחלה נוכחית|סיבת הפניה בקבלה)\r?\n/;
            complaintRegex = /\r?\n(?:תלונת החולה \/ תלונה עקרית|תלונה עקרית|סיבת הפניה בקבלה|סיבת הביקור)\r?\n([\s\S]*?)\r?\nמחלה נוכחית\r?\n/s;
            discussionRegex = /\r?\nמהלך ודיון\r?\n([\s\S]*?)\r?\n(?:המלצות|תוצאות מעבדה)\r?\n/s;
            additionalInfoRegex = /יעוצים\r?\n([\s\S]*?)\r?\n(?:תוצאות בדיקות עזר\r?\n|מהלך ודיון\r?\n|ציוני אומדנים)/s;
        }
        recommendationsRegex = /\r?\n(?:המלצות|המלצות רופא)\r?\n([\s\S]*?)(?:\r?\nתרופות מומלצות להמשך טיפול\r?\n|\r?\nחתימה דיגיטלית\r?\n|r?\nמכתב נחתם ע"י: |r?\nחתימה:|\r?\nרופא אחראי\r?\n)/s;

        doctorRegex = /\r?\n(?:חתימה דיגיטלית\r?\nרופא מטפל : רישיון:\r?\n|מכתב נחתם ע"י: |מכתב נחתם ע"י:)([^0-9]+)(?:\r?\nרישיון:| מ.ר.|(\d+)\r?\n)/s;
        //   additionalInfoRegex = /יעוצים\r?\n([\s\S]*?)\r?\n(?:תוצאות בדיקות עזר\r?\n|מהלך ודיון\r?\n|ציוני אומדנים)/s;
        licenseRegex = /\r?\nרישיון:\r?\n(\d+)(?:\r?\nחתימה דיגיטלית:\r?\n|\r?\nחתימה:|\r?\n_________\[DIGITALSIGN\]חתימה:)/;

    }

    // ==================================================== אסותא ================================================


    else if (hospital == "אסותא אשדוד") {

        let isFirstMatch = true;

        text = text.replace(/\r?\nPage \d+ of \d+\r?\n[\s\S]*?\*\*\*חסוי רפואי\*\*\*/g, (match) => {
            //      if (isFirstMatch && match.includes("Page 1 of")) {
            //          isFirstMatch = false;
            //           return match; // return the original match for the first occurrence
            //      }
            return ''; // return an empty string for all other occurrences
        });

        text = text.replace(/Page \d+ of \d+/g, '');

        nameRegex = /שם פרטי: (.*?)ת\. זהות:/s;

        //check if it is a hospitalisation relese

        let nameMatch = text.match(nameRegex);
        if (text.indexOf("מכתב שחרור מתאריך") >= 0 && nameMatch && nameMatch.index > text.indexOf("מכתב שחרור מתאריך")) {
            typeOfFile = "סיכום שחרור מאשפוז";
        }
        else if (text.indexOf("סיכום ביקור במחלקה לרפואה דחופה") >= 0 && nameMatch && nameMatch.index > text.indexOf("סיכום ביקור במחלקה לרפואה דחופה")) {
            typeOfFile = "סיכום שחרור ממיון";
        }
        else if (text.indexOf("סיכום ביקור מתאריך") >= 0 && nameMatch && nameMatch.index > text.indexOf("סיכום ביקור מתאריך")) {
            typeOfFile = "סיכום ביקור במרפאה";
        }
        //console.log("--" + text.indexOf("מכתב שחרור מתאריך"), "+" + (nameMatch ? nameMatch.index : 'No match'));


        lastNameRegex = /שם משפחה: (.*?)ת\. לידה:/s;
        idRegex = /ת\. זהות: (\d+)/;
        registryNumberRegex = /\r?\n(?:מס' קבלה למחלקה: |מס' ביקור: )(\d+)/;
        entryDateRegex = /(?:\r?\nתאריך קבלה למיון: |\r?\nתאריך קבלה למלר"ד: |\r?\nסיכום ביקור מתאריך )(\d{2}\/\d{2}\/\d{4})/;
        releaseDateRegex = /(?:תאריך שחרור בפועל\r?\nתאריך שחרור: : |שחרור ממחלקת אם ועובר מתאריך |מכתב שחרור מתאריך )(\d{2}\/\d{2}\/\d{4})/;
        wardRegex = /\r?\n(?:מכתב שחרור מתאריך|סיכום ביקור מתאריך) \d{2}\/\d{2}\/\d{4}\r?\n(.*?)\r?\n/s;
        entryTimeRegex = /\r?\nשעת קבלה למלר"ד: (\d{2}:\d{2})/;
        complaintRegex = /\r?\n(?:תלונת החולה \/ תלונה עקרית|תלונה עקרית|סיבת הפניה בקבלה)\r?\n([\s\S]*?)\r?\n(?:מחלה נוכחית\r?\n|נחתם ע"י: )/s;
        diagnosisRegex = /\r?\n(?:אבחנות בשחרור|אבחנות מסכמות|אבחנות מיילדותיות)\r?\n([\s\S]*?)\r?\n(?:תלונה עיקרית|מחלה נוכחית|סיכום ודיון|הריון נוכחי|תלונה עקרית)\r?\n/;
        currentDiseaseRegex = /\r?\nמחלה נוכחית\r?\n([\s\S]*?)\r?\n(?:מדדים בקבלה|בדיקה גופנית בקבלה|תוצאות בדיקות עזר|מהלך ודיון|סיכום ביקור|מעקב הריון|בדיקות במהלך ההריון|מהלך האשפוז|פעולות\/ניתוחים שבוצעו)\r?\n/s;
        physicalExamRegex = /\r?\nבדיקה גופנית בקבלה\r?\n([\s\S]*?)\r?\n(?:תוצאות בדיקות עזר|תוצאות מעבדה|יעוצים|בדיקות עזר ברכיב|מהלך ודיון)\r?\n/s;
        discussionRegex = /(?:\r?\nמהלך ודיון\r?\n|\r?\nסיכום ודיון\r?\nתאריך ושעה נושא נרשם ע"י פרטים\r?\n\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}\r?\n|\r?\nסיכום ביקור\r?\n|\r?\nמהלך האשפוז\r?\n|\r?\nסיכום\r?\n)([\s\S]*?)\r?\n(?:המלצות בשחרור|תוצאות מעבדה|תרופות מומלצות|תרופות להמשך טיפול)\r?\n/s;
        recommendationsRegex = /\r?\nהמלצות בשחרור\r?\n([\s\S]*?)(?:\r?\nתרופות להמשך טיפול\r?\n|\r?\nתוצאות מעבדה\r?\n|\r?\nסימנים חיוניים\r?\n|\r?\nתרופות מומלצות\r?\n|\r?\nנחתם ע"י: )/s;
        doctorRegex = /\r?\nנחתם ע"י: ([\s\S]*?) מ.ר./s;
        additionalInfoRegex = /\r?\nיעוצים\r?\n([\s\S]*?)\r?\n(?:תוצאות בדיקות עזר\r?\n|מהלך ודיון\r?\n|ציוני אומדנים|סיכום\r?\n|המלצות בשחרור\r?\n)/s;
        licenseRegex = /\r?\nרישיון:\r?\n(\d+)(?:\r?\nחתימה דיגיטלית:\r?\n|\r?\nחתימה:|\r?\n_________\[DIGITALSIGN\]חתימה:)/;



        //     let regex = /\r?\nסיכום ודיון\r?\nפרטיםנרשם ע"ינושאתאריך ושעה\r?\n\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}([\s\S]*?)\r?\nהמלצות בשחרור\r?\n/s;

    }
    // ==================================================== ברזילי ================================================
    else if (hospital == "ברזילי") {

        let isFirstMatch = true;
        //      /מחלק[תה].*\nPage \d+ of \d+/g
        text = text.replace(/Page \d+ of \d+\n.*(?:מחלק[תה]|מיון).*\n/g, (match) => {
            //if (isFirstMatch && match.includes("Page 1 of")) {
            //  isFirstMatch = false;
            //  return match; // return the original match for the first occurrence
            //}
            return ''; // return an empty string for all other occurrences
        });

        text = text.replace(/Page \d+ of \d+/g, '');

        namesRegex = /(\S+) (\S+)\nת\.ז \.:([\d]+) מין: \S+ ת\.לידה: \d{2}\/\d{2}\/\d{4}גיל: \d+/;
        //nameRegex = /שם פרטי: (.*?)ת\. זהות:/s;

        //check if it is a hospitalisation relese

        let namesMatch = text.match(namesRegex);
        if (text.indexOf("מכתב שחרור רפואי") >= 0 && namesMatch && namesMatch.index > text.indexOf("מכתב שחרור רפואי")) {
            typeOfFile = "סיכום שחרור מאשפוז";
        }
        else if ((text.indexOf("סיכום ביקור במיון") >= 0 || text.indexOf("מיון אף אוזן גרון") >= 0) && namesMatch && namesMatch.index > (text.indexOf("סיכום ביקור במיון") >= 0 || text.indexOf("מיון אף אוזן גרון") >= 0)) {
            typeOfFile = "סיכום שחרור ממיון";
        }
        else if (text.indexOf("סיכום ביקור מתאריך") >= 0 && namesMatch && namesMatch.index > text.indexOf("סיכום ביקור מתאריך")) {
            typeOfFile = "סיכום ביקור במרפאה";
        }
        //console.log("--" + text.indexOf("מכתב שחרור מתאריך"), "+" + (nameMatch ? nameMatch.index : 'No match'));


        // lastNameRegex = /שם משפחה: (.*?)ת\. לידה:/s;
        // idRegex = /ת\. זהות: (\d+)/;


        registryNumberRegex = /\r?\n(?:מכתב שחרור רפואי |סיכום ביקור במיון |שחרור רפואי )(\d+)/;
        entryDateRegex = /(?:\r?\nקבלה לביה"ח: |נתוני ביקור במיון\r?\nתאריך קליטה במיון: )(\d{2}\/\d{2}\/\d{4})/;
        releaseDateRegex = /(?:תאריך שחרור\r?\nתאריך שחרור: : |תאריך שחרור בפועל\r?\nתאריך שחרור: : |תאריך שחרור בפועל1\r?\nתאריך שחרור: : )(\d{2}\/\d{2}\/\d{4})/;
        wardRegex = /סודי רפואי\n[\s\S]*?מחלק[הת] ([\s\S]+?) מעודכן ל:/;
        entryTimeRegex = /(?:\r?\nקבלה לביה"ח: |נתוני ביקור במיון\r?\nתאריך קליטה במיון: )\d{2}\/\d{2}\/\d{4} , שעה: (\d{2}:\d{2})/;
        complaintRegex = /\r?\n(?:תלונת החולה \/ תלונה עקרית|תלונה עקרית|תלונה עיקרית|סיבת הפניה בקבלה)\r?\n([\s\S]*?)\r?\n(מחלה נוכחית|בדיקה גופנית בקבלה|סיכום רופא שחרור|אבחנות במיון|מדדים)\r?\n/s;
        diagnosisRegex = /\r?\nאבחנות (?:בשחרור|במיון)\r?\nRec M\/P S\/P עיקרי תאריך צד קוד אבחנה\r?\n([\s\S]*?)\r?\n(אבחנות רקע|תלונה עיקרית|מדדים|רגישות לתרופות)\r?\n/;
        currentDiseaseRegex = /\r?\nמחלה נוכחית\r?\n([\s\S]*?)\r?\n(?:מדדים בקבלה|מדדים|תרופות קבועות|בדיקה גופנית בקבלה|תוצאות בדיקות עזר|מהלך ודיון|סיכום ביקור)\r?\n/s;
        physicalExamRegex = /\r?\n(?:בדיקה גופנית בקבלה|בדיקה גופנית)\r?\n([\s\S]*?)\r?\n(?:סיכום רופא שחרור|סיכום אשפוז|תוצאות בדיקות עזר|תוצאות מעבדה|יעוצים|בדיקות עזר ברכיב|מהלך ודיון|ביצוע תרופות|סיכום ודיון)\r?\n/s;
        discussionRegex = /\r?\n(?:סיכום רופא שחרור|סיכום אשפוז|סיכום ודיון|מהלך ודיון)\r?\n([\s\S]*?)\r?\n(?:המלצות כלליות|:המלצות בשחרור|תוצאות מעבדה|המלצות|תרופות מומלצות|סיכום סיעודי במיון)\r?\n/s;
        recommendationsRegex = /\r?\n(?:המלצות כלליות|המלצות בשחרור)\r?\n([\s\S]*?)(?:\r?\nתרופות מומלצות\r?\n|\r?\nתרופות להמשך טיפול\r?\n|\r?\nתוצאות מעבדה\r?\n|\r?\nסימנים חיוניים\r?\n|\r?\nחתימת רופא\/ה בשחרור\r?\n|\r?\nסיכום סיעודי במיון\r?\n|\r?\nהוראות לתרופות סופי\r?\n)/s;
        doctorRegex = /\r?\nחתימת רופא\/ה בשחרור\r?\nזמן חתימה תפקיד שם החותם\r?\n[\s\S]*?(?: דר' |רופא |רופא\/ה משחרר )([\s\S]*?)(?: מ.ר.(\d+)\r?\n|רופא\/ה משחרר|\n)/s;
        additionalInfoRegex = /\r?\n(?:יעוצים)\r?\n([\s\S]*?)\r?\n(?:סיכום ודיון\r?\n|תוצאות בדיקות עזר\r?\n|מהלך ודיון\r?\n|ציוני אומדנים)/s;
        licenseRegex = /\r?\nרישיון:\r?\n(\d+)(?:\r?\nחתימה דיגיטלית:\r?\n|\r?\nחתימה:|\r?\n_________\[DIGITALSIGN\]חתימה:)/;

        //  tableAdditionalRegex = /המשךסטטוסתשובת היועץ\r?\nמעקב\r?\nחתימהנרשם ע\`\`יתאריך\r?\n([\s\S]*?)\r?\n(?:סיכום ודיון\r?\n|תוצאות בדיקות עזר\r?\n|מהלך ודיון\r?\n|ציוני אומדנים)/s;

        //     let regex = /\r?\nסיכום ודיון\r?\nפרטיםנרשם ע"ינושאתאריך ושעה\r?\n\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}([\s\S]*?)\r?\nהמלצות בשחרור\r?\n/s;

    }


    if (hospital == "ברזילי") {
        var namesMatch = text.match(namesRegex);
    }
    else {
        var lastnameMatch = text.match(lastNameRegex);
        var nameMatch = text.match(nameRegex);
        var idMatch = text.match(idRegex);
    }

    var registryNumberMatch = text.match(registryNumberRegex);
    var entryDateMatch = text.match(entryDateRegex);
    var releaseDateMatch = text.match(releaseDateRegex);
    var entryTimeMatch = text.match(entryTimeRegex);
    var wardMatch = text.match(wardRegex);
    var diagnosisMatch = text.match(diagnosisRegex);
    var complaintMatch = text.match(complaintRegex);
    var currentDiseaseMatch = text.match(currentDiseaseRegex);
    if (erProgressionRegex != "") var erProgressionMatch = text.match(erProgressionRegex);
    var physicalExamMatch = text.match(physicalExamRegex);
    var discussionMatch = text.match(discussionRegex);
    var recommendationsMatch = text.match(recommendationsRegex);
    var doctorMatch = text.match(doctorRegex);
    var additionalInfoMatch = text.match(additionalInfoRegex);
    var licenseMatch = text.match(licenseRegex);



    var registryNumber = registryNumberMatch ? registryNumberMatch[1] : null;
    var entryDate = entryDateMatch ? entryDateMatch[1] : null;
    var releaseDate = releaseDateMatch ? releaseDateMatch[1] : null;
    var entryTime = entryTimeMatch ? entryTimeMatch[1] : null;
    var ward = wardMatch ? wardMatch[1].trim() : null;
    var diagnosis = diagnosisMatch ? diagnosisMatch[1].trim() : null;
    var complaint = complaintMatch ? complaintMatch[1].trim() : null;
    var currentDisease = currentDiseaseMatch ? currentDiseaseMatch[1].trim() : null;
    if (erProgressionRegex != "") var erProgression = erProgressionMatch ? erProgressionMatch[1].trim() : null;
    var physicalExam = physicalExamMatch ? physicalExamMatch[1].trim() : null;
    var discussion = discussionMatch ? discussionMatch[1].trim() : null;
    var recommendations = recommendationsMatch ? recommendationsMatch[1].trim() : null;
    var doctor = doctorMatch ? doctorMatch[1].trim() : null;
    var additionalInfo = additionalInfoMatch ? additionalInfoMatch[1].trim() : null;
    var license = licenseMatch ? licenseMatch[1] : null;

    if (hospital == "ברזילי") {
        var lastName = namesMatch ? namesMatch[1].trim() : null;
        var name = namesMatch ? namesMatch[2].trim() : null;
        var id = namesMatch ? namesMatch[3] : null;

        if (additionalInfo) {
            additionalInfo = additionalInfo.replace(/(?:תשובת היועץ סטטוסהמשךתאריך נרשםחתימה|תשובת היועץ סטטוסהמשךתאריך נרשם ע``י חתימה)/g, '');
        }

    }
    else {
        var lastName = lastnameMatch ? lastnameMatch[1].trim() : null;
        var name = nameMatch ? nameMatch[1].trim() : null;
        var id = idMatch ? idMatch[1] : null;
    }

    // console.log("erProgression: " + erProgression);


       console.log("doctormatch: " + doctorMatch);
    if (doctorMatch && license == null) {
        license = doctorMatch[2] ? doctorMatch[2].trim() : null;
        if (license == null) {
            var textSplit = text.split(doctorRegex);
            var lastPart = textSplit[textSplit.length - 1];
            licenseRegex = /(\d+)/;
            licenseMatch = lastPart.match(licenseRegex);
            license = licenseMatch ? licenseMatch[1] : null;
        }
    }

    if (hospital == "סורוקה" && typeOfFile == "סיכום שחרור ממיון") {
        // remove from discussion the name and licence of the doctor ie "דר' יוסי כהן מ.ר.123456"
        // discussion = discussion.replace(/דר' .*? מ.ר.\d+/, '');  
        ward = "מיון";
    }
    else if (hospital == "אסותא אשדוד" && typeOfFile == "סיכום שחרור ממיון") {
        // remove from discussion the name and licence of the doctor ie "דר' יוסי כהן מ.ר.123456"
        if (discussion) discussion = discussion.replace(/דר' .*? מ.ר.\d+/, '');
        ward = "מיון";
    }
    else if (hospital == "ברזילי" && typeOfFile == "סיכום שחרור ממיון") {
        // remove from discussion the name and licence of the doctor ie "דר' יוסי כהן מ.ר.123456"
        ward = "מיון";
    }

    console.log("-+" + typeOfFile);

    return { ToContinue: true, lastName, name, id, registryNumber, entryDate, releaseDate, entryTime, ward, diagnosis, complaint, currentDisease, erProgression, physicalExam, discussion, recommendations, doctor, license, hospital, additionalInfo, typeOfFile };
}

function formatData(text) {

    //   var heading = localStorage.getItem('heading') || '';
    console.log(heading, "heading");

    var data = getNameAndId(text);
    if (data.ToContinue == false) return;
    var formattedData = "";
    if (heading != "") { formattedData = heading + `\n`; }

    if (data.typeOfFile) { formattedData += data.typeOfFile + "\n"; }


    formattedData += `שם מטופל: ${data.name} ${data.lastName}\nתעודת זהות: ${data.id}\n\n`;

    if (data.hospital) {
        formattedData += `בית חולים: ${data.hospital}\n`;
    }
    if (data.ward && data.typeOfFile != "סיכום ביקור במרפאה") {
        formattedData += `מחלקה: ${data.ward}\n`;
    }
    else if (data.ward) {
        formattedData += `מרפאה: ${data.ward}\n`;
    }

    if (data.entryDate) {
        formattedData += `תאריך כניסה: ${data.entryDate}\n`;
    }
    if (data.entryTime) {
        formattedData += `שעת כניסה: ${data.entryTime}\n`;
    }
    if (data.releaseDate) {
        formattedData += `תאריך שחרור: ${data.releaseDate}\n`;
    }
    if (data.registryNumber) {
        formattedData += `מספר קבלה: ${data.registryNumber}\n`;
    }
    formattedData += `\n`;

    if (data.diagnosis) {
        formattedData += `##אבחנות:## \n${data.diagnosis}\n\n`;
    }
    if (data.complaint) {
        formattedData += `##תלונה עיקרית:## \n${data.complaint}\n\n`;
    }
    if (data.currentDisease) {
        formattedData += `##מחלה נוכחית:## \n${data.currentDisease}\n\n`;
    }
    if (data.physicalExam) {
        formattedData += `##בדיקה גופנית:## \n${data.physicalExam}\n\n`;
    }
    if (data.erProgression) {
        formattedData += `##מהלך במיון:## \n${data.erProgression}\n\n`;
    }
    if (data.additionalInfo) {
        formattedData += `##ייעוצים:## \n${data.additionalInfo}\n\n`;
    }
    if (data.discussion) {
        formattedData += `##דיון ותוכנית:## \n${data.discussion}\n\n`;
    }
    if (data.recommendations) {
        formattedData += `##המלצות:## \n${data.recommendations}\n\n`;
    }
    if (data.doctor) {
        formattedData += `רופא מטפל: ${data.doctor}\n`;
    }
    if (data.license) {
        formattedData += `מספר רשיון: ${data.license}`;
    }

    let missingFields = [];
    if (!data.name) {
        missingFields.push('שם');
    }
    if (!data.id) {
        missingFields.push('ת.ז.');
    }
    if (!data.ward) {
        missingFields.push('מחלקה');
    }
    if (!data.currentDisease && data.typeOfFile != "סיכום שחרור ממיון") {
        missingFields.push('מחלה נוכחית');
    }
    if (!data.discussion) {
        missingFields.push('דיון');
    }

    if (missingFields.length > 0) {
        let shouldProceed = confirm(`לא מצאנו חלקים מסויימים שציפינו למצוא בקובץ: ${missingFields.join(', ')}. האם ברצונך להמשיך?`);
        if (!shouldProceed) {
            return; // stop execution if the user chooses not to proceed
        }
    }

    if (!data.id || isNaN(data.id)) {
        let shouldProceed = confirm("שגיאה במציאת תעודת הזהות של המטופל בסיכום. האם ברצונך להמשיך בכל זאת?")
        if (!shouldProceed) {
            return;
        }
    }
    else {
        if (parseInt(data.id) != currentPatientId) {
            let shouldProceed = confirm("המטופל שבקובץ אינו תואם למטופל שנבחר במערכת. האם ברצונך להמשיך בכל זאת?")
            if (!shouldProceed) {
                return;
            }
        }
    }

    return formattedData;
}




function waitForElementToExist(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(() => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            subtree: true,
            childList: true,
        });
    });
}


function findElementByText(text, contextElement) {
    const xpath = `//*[text()[contains(., '${text}')]]`;
    const xpathEvaluator = new XPathEvaluator();
    const xpathResult = xpathEvaluator.evaluate(xpath, contextElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return xpathResult.singleNodeValue;
}


// Create a callback function to execute when mutations are observed
const callback = function (mutationsList, observer) {
    for (let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            // Check if fileUploader is still in the DOM
            if (!isThereAlisteningEvent && !document.body.contains(fileUploader)) {
                console.log('fileUploader was removed from the DOM');
                statusLabel.innerText = 'מוכן';
                // Re-add the event listener
                waitForElementToExist('#medical-visit-details').then(handleVisitDetailsElement);
                isThereAlisteningEvent = true;
            }
        }
    }
};

function getHeading() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get('heading', function (data) {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            resolve(data.heading || '');
        });
    });
}

async function insertSummary() {
    // Get the "דיון ותוכנית" textarea
    var discussionDiv = document.querySelector('#discussion-and-plan');
    var textarea3 = discussionDiv.querySelector('textarea:first-of-type');

    // Check if the textarea is not empty
    if (textarea3.value.trim() != "") {
        alert("אנחנו רוצים להכניס את הסיכום בדיון ותוכנית, אבל זה לא ריק. אנא מחק אותו לפני כן");
    } else if (lastFormattedText != "") {
        // getSummery of the lastFormattedText if it is not empty, to log
        statusLabel.textContent = 'מסכם, זה עשוי לקחת כמה שניות...';
        try {
            lastSummery = await getSummary(lastFormattedText);
        }
        catch (err) {
            console.log(err);
            statusLabel.textContent = "אירעה שגיאה בסיכום התוכן. נסה שוב בעוד כמה דקות";
            return;
        }
        let summaryText = extractHebrewTags(lastSummery);

        // Insert the summary into the textarea
        textarea3.value = summaryText;

        if (textarea3.value) {
            var event3 = new Event('input', {
                bubbles: true,
                cancelable: true,
            });

            textarea3.dispatchEvent(event3);
        }

        statusLabel.textContent = 'סוכם בהצלחה ב"דיון ותוכנית"';

        //    console.log("lastSummery: " + summaryText);
    }
    else {
        alert("קודם בחר סיכום");
    }
}


async function getSummary(text) {

    const postData = {
        role: "user",
        content: "please summerize the following medical case: " + text
    };

    const response = await fetch('https://cprgod.000webhostapp.com/gpt-api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(postData).toString()
    });

    const mytext = await response.text();
    //       console.log(mytext);  // Log the text response to the console

    const data = JSON.parse(mytext);  // Parse the text response as JSON
    //        console.log(data);  // Log the API response to the console



    //    console.log(data.choices);
    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }

    if (!Array.isArray(data.choices) || data.choices.length === 0) {
        throw new Error('No choices in API response');
    }

    return data.choices && data.choices[0] && data.choices[0].message.content ? data.choices[0].message.content.trim() : '';
}


function extractHebrew(text) {
    const hebrewRegex = /[\u0590-\u05FF0-9\s]+/g;
    const matches = text.match(hebrewRegex);
    return matches ? matches.join('') : '';
}
function extractHebrewTags(text) {
    const hebRegex = /<heb>(.*?)<\/heb>/gs;
    const matches = text.match(hebRegex);
    return matches ? matches.map(match => match.replace(/<\/?heb>/g, '')).join(' ') : '';
}

// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback);

// Start observing the document with the configured parameters
observer.observe(document.body, { childList: true, subtree: true });


