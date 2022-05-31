import ForgeUI, { Table, Head, Row, Cell, ProjectPage, render, Fragment, Text, IssuePanel, useProductContext, useState } from '@forge/ui';
import api, { route } from '@forge/api';

const fetchNumberOfComments = async function(issueKey) {
  const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}/comment`);
  const data = await response.json();
  return data.total;
}

const fetchIssuesWithNumberOfComments = async function(projectKey) {
  const jql = `project in (${projectKey})`;
  const response = await api.asApp().requestJira(route`/rest/api/3/search?jql=${jql}`);
  const data = await response.json();

  let issuesWithNumberOfComments = [];
  for (const issue of data.issues) {
    const numberOfComments = await fetchNumberOfComments(issue.key);
    issuesWithNumberOfComments.push({"key": issue.key, "summary": issue.fields.summary, "numComments": numberOfComments});
  }
  return issuesWithNumberOfComments;
}

const updateEngagementScore = async function(issueId, score) {
  const fieldKey = "dcc791bc-e6f9-4c76-ae4c-085f7ff281fb__DEVELOPMENT__engagement_score_field";
  const body = {update: [
    {
        issueIds: [issueId],
        value: score
    }
]};
  const response = await api.asApp().requestJira(route`/rest/api/app/field/${fieldKey}/value`, {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  console.log(`Response ${response.status} ${reponse.statusText}`);
}

const EngagementPanel = () => {
  // console.log(JSON.stringify(useProductContext()));
  const {platformContext: {issueKey}} = useProductContext();
  const [numComments] = useState(fetchNumberOfComments(issueKey));
  return (
    <Fragment>
      <Text>Score d'engagement : {numComments}</Text>
    </Fragment>
  );
};

export const panel = render(
  <IssuePanel>
    <EngagementPanel />
  </IssuePanel>
);

const EngagementOverview = () => {
  const {platformContext: {projectKey}} = useProductContext();
  const [issues] = useState(fetchIssuesWithNumberOfComments(projectKey));
  console.log(JSON.stringify(issues));
  return (
    <Table>
      <Head>
        <Cell><Text>Issue Key</Text></Cell>
        <Cell><Text>Summary</Text></Cell>
        <Cell><Text>Engagement Score</Text></Cell>
      </Head>
      {issues.map(issue => (
          <Row>
            <Cell><Text>{issue.key}</Text></Cell>
            <Cell><Text>{issue.summary}</Text></Cell>
            <Cell><Text>{issue.numComments}</Text></Cell>
          </Row>
      ))}

    </Table>
  )
}

export const engagementOverview = render(
  <ProjectPage>
      <EngagementOverview/>
  </ProjectPage>
)

export async function trigger(event, context) {
  console.log("Trigger fired)");
  console.log(JSON.stringify(event));
  const numComments = await fetchNumberOfComments(event.issue.key);
  await updateEngagementScore(event.issue.id, numComments);
  console.log("Trigger finished");
}