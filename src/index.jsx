import ForgeUI, { ProjectPage, render, Fragment, Text, IssuePanel, useProductContext, useState } from '@forge/ui';
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
    <Fragment>
      <Text>Ici va l'overview des engagements</Text>
    </Fragment>
  )
}

export const engagementOverview = render(
  <ProjectPage>
      <EngagementOverview/>
  </ProjectPage>
)