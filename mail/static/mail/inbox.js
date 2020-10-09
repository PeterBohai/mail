document.addEventListener('DOMContentLoaded', function () {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);

    // Actions when submitting compose email form
    document.querySelector('#compose-form').onsubmit = () => {
        // retrieve data entered by the user
        const recipients = document.querySelector('#compose-recipients').value
        const subject = document.querySelector('#compose-subject').value;
        const body = document.querySelector('#compose-body').value;

        // Send POST request to /emails
        fetch('/emails', {
            method: 'POST',
            body: JSON.stringify({recipients, subject, body})
        })
            .then(response => response.json())
            .then(result => {
                if (result.error) {
                    console.log(`Error sending email: ${result.error}`);
                } else {
                    load_mailbox('sent');
                }
            })
            .catch(err => console.log(err))

        return false;
    }

    // By default, load the inbox
    load_mailbox('inbox');
});

function compose_email(event, recipients = '', subject = '', body = '') {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#email-view').style.display = 'none';

    document.querySelector('#compose-recipients').value = recipients;
    document.querySelector('#compose-subject').value = subject;
    document.querySelector('#compose-body').value = body;
    if (body.length > 0) {
      document.querySelector('#compose-body').focus();
    } else {
      document.querySelector('#compose-recipients').focus();
    }
}

function load_mailbox(mailbox) {
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'none';

    if (mailbox === "inbox") {
        document.querySelector('#inbox').style.borderBottom = '3px solid #d93025';
        document.querySelector('#inbox').style.color = '#d93025';

        document.querySelector('#sent').style.borderBottom = '3px solid lightgrey';
        document.querySelector('#sent').style.color = '#5f6368';
        document.querySelector('#archived').style.borderBottom = '3px solid lightgrey';
        document.querySelector('#archived').style.color = '#5f6368';
    } else if (mailbox === "sent") {
        document.querySelector('#sent').style.borderBottom = '3px solid #188038';
        document.querySelector('#sent').style.color = '#188038';

        document.querySelector('#inbox').style.borderBottom = '3px solid lightgrey';
        document.querySelector('#inbox').style.color = '#5f6368';
        document.querySelector('#archived').style.borderBottom = '3px solid lightgrey';
        document.querySelector('#archived').style.color = '#5f6368';
    } else {
        document.querySelector('#archived').style.borderBottom = '3px solid #fabf19';
        document.querySelector('#archived').style.color = '#fabf19';

        document.querySelector('#inbox').style.borderBottom = '3px solid lightgrey';
        document.querySelector('#inbox').style.color = '#5f6368';
        document.querySelector('#sent').style.borderBottom = '3px solid lightgrey';
        document.querySelector('#sent').style.color = '#5f6368';
    }

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<div class="mailbox-title">${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</div>`;

    // Request for emails from the specified mailbox
    fetch(`/emails/${mailbox}`)
        .then(response => response.json())
        .then(emails => {
            emails.forEach(email => {
                const div = document.createElement("div");
                div.innerHTML = `
                    <div class="far fa-square" style="color: grey; margin-right: 20px;"></div>
                    <span style="width: 240px; display: inline-block">${email.sender}</span>
                    <span>${email.subject}</span> 
                    <span style="float: right; font">${email.timestamp}</span>`
                div.className = "mailbox-email"
                if (email.read) {
                    div.style.fontWeight = 'normal';
                }

                // display the contents of the specific email that was clicked
                div.addEventListener('click', function() {

                    fetch(`/emails/${email.id}`)
                        .then(response => response.json())
                        .then(email => {
                            // set this email to read by sending a PUT request
                            if (!email.read) {
                                fetch(`/emails/${email.id}`, {
                                    method: 'PUT',
                                    body: JSON.stringify({read: true})
                                })
                                    .then(response => {console.log(`PUT status for updating read state returned status code ${response.status}`)})
                            }
                            // load the details of the email onto the page
                            loadEmail(email, mailbox)
                        });
                })

                // Change background color of email if it has been read already
                div.style.backgroundColor = "white";
                if (email.read) {
                  div.style.backgroundColor = "rgba(242,245,245,0.8)";
                }
                document.querySelector("#emails-view").append(div)
            })
        });
}

function loadEmail(emailData, fromMailbox) {
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'block';

    const subjectTitle = document.createElement("div");
    subjectTitle.innerHTML = emailData.subject;
    subjectTitle.className = 'subject-title';

    const detailedInfo = document.createElement("div");
    detailedInfo.style.fontSize = '14px'
    detailedInfo.style.marginBottom = '10px'
    detailedInfo.innerHTML = `
        <div>
            <span class="text-muted">From: </span>${emailData.sender}
            <span class="text-muted" style="float: right; font-size: 13px">${emailData.timestamp}<i class="far fa-star" style="margin-left: 16px"></i></span>
        </div>
        <div>
            <span class="text-muted">To: </span>${emailData.recipients.join()}
        </div>
        <div>
            <span class="text-muted">Subject: </span>${emailData.subject}
        </div>
    `
    const fromLine = document.createElement("div");
    fromLine.innerHTML = `<span class="text-muted">From: </span>${emailData.sender}`;

    const toLine = document.createElement("div");
    toLine.innerHTML = `<span class="text-muted">To: </span>${emailData.recipients.join()}`;

    const subjectLine = document.createElement("div");
    subjectLine.innerHTML = `<span class="text-muted">Subject: </span>${emailData.subject}`;

    const timestampLine = document.createElement("div");
    timestampLine.innerHTML = `<span class="text-muted">Timestamp: </span>${emailData.timestamp}`;

    const bodySection = document.createElement("div");
    bodySection.innerText = emailData.body;
    bodySection.style.marginTop = '20px';

    const replyButton = document.createElement("button");
    replyButton.innerHTML = "<i class=\"fas fa-arrow-circle-left\" style='margin-right: 5px'></i>Reply";
    replyButton.className = "email-btns btn btn-sm btn-outline-secondary";
    replyButton.addEventListener('click', function(event) {
        let subject = emailData.subject
        if (!emailData.subject.startsWith("Re: ")) {
          subject = `Re: ${subject}`
        }
        let body = `On ${emailData.timestamp} <${emailData.sender}> wrote:\n${emailData.body}\n--------\n`
        let recipient = emailData.sender;
        compose_email(event, recipient, subject, body)
    });

    // Load the components to be displayed
    document.querySelector('#email-view').innerHTML = "";
    document.querySelector('#email-view').append(subjectTitle)
    document.querySelector('#email-view').append(detailedInfo)
    document.querySelector('#email-view').append(replyButton)

    // Add archive buttons according to whether the email is in the inbox or archive mailbox
    if (fromMailbox === "inbox") {
        const archiveButton = document.createElement("button");
        archiveButton.innerHTML = "<i class=\"fas fa-archive\" style=\"margin-right: 5px\"></i>Archive"
        archiveButton.className = "email-btns btn btn-sm btn-outline-warning"
        archiveButton.addEventListener('click', function() {
            fetch(`/emails/${emailData.id}`, {
                method: 'PUT',
                body: JSON.stringify({archived: true})
            })
                .then(response => {
                    console.log(`PUT status for updating archive state returned status code ${response.status}`)
                    load_mailbox("inbox")
                })
        })
        document.querySelector('#email-view').append(archiveButton)
    } else if (fromMailbox === "archive") {
        const unarchiveButton = document.createElement("button");
        unarchiveButton.innerHTML = "<i class=\"fas fa-inbox\" style=\"margin-right: 5px\"></i>Move to inbox"
        unarchiveButton.className = "email-btns btn btn-sm btn-outline-danger"
        unarchiveButton.addEventListener('click', function() {
            fetch(`/emails/${emailData.id}`, {
                method: 'PUT',
                body: JSON.stringify({archived: false})
            })
                .then(response => {
                    console.log(`PUT status for updating archive state returned status code ${response.status}`)
                    load_mailbox("inbox")
                })
        })
        document.querySelector('#email-view').append(unarchiveButton)
    }
    document.querySelector('#email-view').append(bodySection)
}