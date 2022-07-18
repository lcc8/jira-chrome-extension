const jiraUser = `{username}:{password}`;
const area='"Engage Platform"';
const team='"Engage Platform - Odyssey"';

const backLog = "BACKLOG";
const needsReview = "NEEDS REVIEW";
const inReview = "IN REVIEW";
const blocked = "BLOCKED";
const toDo = "TO DO";
const ready = "READY";
const inProgress = "IN PROGRESS";
const inTesting = "IN TESTING";
const onHold = "ON HOLD";
const done = "DONE";
const rejected = "REJECTED";
const workFlowStoryPointMap = new Map();
let isCalculateSprint = false;

function setDefaultWorkFlowStoryPoint(){
    workFlowStoryPointMap.set(backLog, 0);
    workFlowStoryPointMap.set(needsReview, 0);
    workFlowStoryPointMap.set(inReview, 0);
    workFlowStoryPointMap.set(blocked, 0);
    workFlowStoryPointMap.set(toDo, 0);
    workFlowStoryPointMap.set(ready, 0);
    workFlowStoryPointMap.set(inProgress, 0);
    workFlowStoryPointMap.set(inTesting, 0);
    workFlowStoryPointMap.set(onHold, 0);
    workFlowStoryPointMap.set(done, 0);
}

function processTicket(ticket) {

    let status = ticket.fields.status.name.toUpperCase();
    let storyPoint = ticket.fields.customfield_10078;
    console.log("Processing... " + ticket.key + " " + ticket.fields.summary, status, storyPoint);

    let totalBacklogStoryPoints = workFlowStoryPointMap.get(backLog);
    let totalNeedsReviewStoryPoints = workFlowStoryPointMap.get(needsReview);
    let totalInReviewStoryPoints = workFlowStoryPointMap.get(inReview);
    let totalBlockedStoryPoints = workFlowStoryPointMap.get(blocked);
    let totalToDoStoryPoints = workFlowStoryPointMap.get(toDo);
    let totalReadyStoryPoints = workFlowStoryPointMap.get(ready);
    let totalOnHoldStoryPoints = workFlowStoryPointMap.get(onHold);
    let totalInProgressStoryPoints = workFlowStoryPointMap.get(inProgress);
    let totalInTestingStoryPoints = workFlowStoryPointMap.get(inTesting);
    let totalDoneStoryPoints = workFlowStoryPointMap.get(done);

    switch (status) {
        case backLog:
            totalBacklogStoryPoints += storyPoint;
            workFlowStoryPointMap.set(backLog, totalBacklogStoryPoints);
            break;
        case needsReview:
            totalNeedsReviewStoryPoints += storyPoint;
            workFlowStoryPointMap.set(needsReview, totalNeedsReviewStoryPoints);
            break;
        case inReview:
            totalInReviewStoryPoints += storyPoint;
            workFlowStoryPointMap.set(inReview, totalInReviewStoryPoints);
            break;
        case blocked:
            totalBlockedStoryPoints += storyPoint;
            workFlowStoryPointMap.set(blocked, totalBlockedStoryPoints);
            break;
        case toDo:
            totalToDoStoryPoints += storyPoint;
            workFlowStoryPointMap.set(toDo, totalToDoStoryPoints);
            break;
        case ready:
            totalReadyStoryPoints += storyPoint;
            workFlowStoryPointMap.set(ready, totalReadyStoryPoints);
            break;
        case inProgress:
            totalInProgressStoryPoints += storyPoint;
            workFlowStoryPointMap.set(inProgress, totalInProgressStoryPoints);
            break;
        case inTesting:
            totalInTestingStoryPoints += storyPoint;
            workFlowStoryPointMap.set(inTesting, totalInTestingStoryPoints);
            break;
        case onHold:
            totalOnHoldStoryPoints += storyPoint;
            workFlowStoryPointMap.set(onHold, totalOnHoldStoryPoints);
            break;
        case done:
            totalDoneStoryPoints += storyPoint;
            workFlowStoryPointMap.set(done, totalDoneStoryPoints);
            break;
        case rejected:
            // ignore
            break;
        default:
            createMessage("Unknown status " + status)
    }

    console.log(Object.fromEntries(workFlowStoryPointMap));
}

function getInputSprint(){
    const sprintElement = document.getElementById("sprint");
    console.log(sprintElement.value);
    return sprintElement.value;
}

function getJiraUrl(){
    let inputSprint = getInputSprint();
    let sprint = '';
    let statusNotDone=', "Done"';
    if(inputSprint){
        isCalculateSprint = true;
        sprint = '+AND+Sprint+=+' + inputSprint;
        statusNotDone = ''
    }
    let jql = 'jql=PROJECT+=+GTECH+AND+cf%5B15373%5D+=+' + area +
        '+AND+cf%5B13780%5D+=+' + team +
        '+AND+issueFunction+NOT+IN+hasSubtasks()' +
        '+AND+status+not+in+("Rejected"' + statusNotDone + ')' +
        sprint +
        '+ORDER+BY+Rank+ASC';
    let maxTicketsReturn = '&maxResults=1000'
    const url = 'https://jira.gamesys.co.uk/rest/api/2/search?' + jql + maxTicketsReturn;
    return url;
}

async function getJiraTicketsData() {
    console.log("Calling Jira to get tickets");
    let url = getJiraUrl();
    let headers = new Headers();
    headers.set('Authorization', 'Basic ' + btoa(jiraUser))
    await fetch(url, {method: 'GET', headers: headers})
        .then(response => {
            if (!response.ok) {
                throw new Error("Something went wrong");
            }
            return response.json();
        })
        .then(data => {
            if (data.total === 0) {
                createMessage("no ticket found")
            }
            let tickets = data.issues;
            console.log(tickets);
            tickets.forEach(ticket => {
                processTicket(ticket);
            })
        })
        .catch((error) => {
            createMessage(error);
        });
};

function createTableBody() {
    const tbody = document.createElement("tbody");
    let totalSprintStoryPoint = 0;
    workFlowStoryPointMap.forEach((value, key) => {
        const row = document.createElement("tr");
        const swimlane_column_name = document.createElement("td");
        const swimlane_column_total_estimate = document.createElement("td");

        swimlane_column_name.appendChild(document.createTextNode(key));
        swimlane_column_total_estimate.appendChild(document.createTextNode(value));

        row.appendChild(swimlane_column_name);
        row.appendChild(swimlane_column_total_estimate);
        tbody.appendChild(row);

        totalSprintStoryPoint += value;

    });

    if(isCalculateSprint){
        const row = document.createElement("tr");
        const swimlane_column_name = document.createElement("td");
        const swimlane_column_total_estimate = document.createElement("td");
        swimlane_column_name.appendChild(document.createTextNode("Sprint Progress"));
        swimlane_column_total_estimate.appendChild(document.createTextNode(
            (workFlowStoryPointMap.get(done)/totalSprintStoryPoint*100).toFixed(2) + "%"));
        row.appendChild(swimlane_column_name);
        row.appendChild(swimlane_column_total_estimate);
        tbody.appendChild(row);
    }

    return tbody;
}

function createTableHeader() {
    const thead = document.createElement("thead");
    const row = document.createElement("tr");
    const swimlane_column_name_header = document.createElement("th");
    const swimlane_column_total_estimate_header = document.createElement("th");

    swimlane_column_name_header.appendChild(document.createTextNode("Column"));
    swimlane_column_total_estimate_header.appendChild(document.createTextNode("Total Estimate"));

    row.appendChild(swimlane_column_name_header);
    row.appendChild(swimlane_column_total_estimate_header);

    thead.appendChild(row);

    return thead;
}

function createTable() {
    const table = document.createElement("table");
    table.setAttribute("id", "storyPointTable");
    const thead = createTableHeader();

    table.appendChild(thead);
    const tbody = createTableBody();
    table.appendChild(tbody);

    const main = document.getElementById("main");
    main.appendChild(table);
}

function createMessage(message) {
    const p = document.createElement("p");
    p.setAttribute("id", "message");
    p.appendChild(document.createTextNode(message));

    const main = document.getElementById("main");
    main.appendChild(p);
    return p;
}

function reset(){
    setDefaultWorkFlowStoryPoint();

    const main = document.getElementById("main");
    // remove the current table if exist
    const existTable = document.getElementById("storyPointTable");
    if(existTable){
        main.removeChild(existTable);
    }
    const message = document.getElementById("message");
    if(message){
        main.removeChild(message);
    }

    isCalculateSprint = false;
}

async function startWorking(){
    const buttonElement = document.getElementById("submit");
    buttonElement.disabled = true;
    reset();
    const result = await getJiraTicketsData();
    createTable();
    buttonElement.disabled = false;
}

function main(){
    const buttonElement = document.getElementById("submit");
    buttonElement.addEventListener("click", startWorking);
}

main();