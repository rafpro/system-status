async function init() {
  const { format } = require('timeago.js');

  const response = await fetch('https://cloud-api.directus.cloud/system/status/past');
  const { data } = await response.json();

  const uptimeResponse = await fetch('https://cloud-api.directus.cloud/system/uptime');
  const uptimeData = await uptimeResponse.json();
  const uptime = uptimeData.data.toFixed(2) + " % Uptime";

  const lastResponse = await fetch('https://cloud-api.directus.cloud/system/status/last');
  const lastData = await lastResponse.json();

  const lastStatus = lastData.data.status;
  const lastUpdated = format(new Date(lastData.data.datetime), 'en_US');

  document.querySelector('#current').classList.add(lastStatus + '-bg');
  document.querySelector('#cloud-api-status').classList.add(lastStatus);
  document.querySelector('#cloud-asset-status').classList.add(lastStatus);
  document.querySelector('#date').innerText = 'Last updated: ' + lastUpdated;

  let allCopy = 'Unknown';
  let cloudCopy = 'Unknown';

  switch(lastStatus) {
    case 'red':
      allCopy = 'System Outage';
      cloudCopy = 'Outage';
      break;
    case 'yellow':
      allCopy = 'Degraded Performance';
      cloudCopy = 'Degraded Performance';
      break;
    case 'green':
      allCopy = 'All Systems Operational';
      cloudCopy = 'Operational';
      break;
  }

  document.querySelector('#current-status').innerText = allCopy;
  document.querySelector('#cloud-api-status').innerText = cloudCopy;
  document.querySelector('#cloud-asset-status').innerText = cloudCopy;

  document.body.classList.remove('loading');

  let incidentsHTML = '';
  let graphHTML = '';

  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = new Intl.DateTimeFormat('default', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
    const reportsInThisDay = data.filter(s => isInDate(new Date(s.datetime), date));

    incidentsHTML += getIncidentListItem(dateString, reportsInThisDay);
    // graphHTML += `<li class="${statusReport.status || 'green'}-bg" title="${dateString}"></li>`;
  }

  document.querySelector('#past-incidents').innerHTML = incidentsHTML;
  document.querySelector('#graph').innerHTML = graphHTML;
  document.querySelector('#uptime').innerHTML = uptime;
}

init();

function getIncidentListItem(dateString, reportsInThisDay = []) {
  if (reportsInThisDay.length === 0) {
    return `
      <li>
        <h3>${dateString}</h3>
        <p>No incidents reported</p>
      </li>
    `;
  }

  return `<li>
    <h3>${dateString}</h3>
    <ul>
      ${
        reportsInThisDay
        .filter(({ status }) => status !== 'green')
        .reduce((acc, { status, description }) => acc += `
          <li>
            <h4 class="${status}">
              ${status === 'red' ?
                'Issues reported for the Directus Cloud API' :
                'Latency reported for the Directus Cloud API'
              }
            </h4>
            <h5>${description || ''}</h5>
            <!--<p>19:30:00 — 19:41:00 UTC</p>-->
          </li>
          `,
        '')
      }
    </ul>
  </li>`
}

function isInDate(date1, date2) {
  return date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear();
}
