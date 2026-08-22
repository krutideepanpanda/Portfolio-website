const repoGrid = document.querySelector('[data-github-repos]');
const repoStatus = document.querySelector('[data-github-status]');
const githubProfile = 'https://github.com/krutideepanpanda';
const githubEndpoint = 'https://api.github.com/users/krutideepanpanda/repos?type=owner&sort=updated&direction=desc&per_page=100';

const makeElement = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
};

const formatDate = (dateString) => new Intl.DateTimeFormat('en', {
  month: 'short', year: 'numeric',
}).format(new Date(dateString));

const makeRepoCard = (repo) => {
  const card = makeElement('article', 'project-card repo-card');
  const top = makeElement('div', 'project-card-top');
  top.append(makeElement('span', '', repo.fork ? 'Public fork' : 'Public repository'));
  top.append(makeElement('span', '', `Updated ${formatDate(repo.pushed_at || repo.updated_at)}`));

  const title = makeElement('h2', '', repo.name.replaceAll('-', ' '));
  const description = makeElement('p', '', repo.description || 'Explore the source, documentation, and project history on GitHub.');
  const tags = makeElement('div', 'tag-list');
  const labels = [repo.language, ...(repo.topics || [])].filter(Boolean).slice(0, 4);
  (labels.length ? labels : ['Source code']).forEach((label) => tags.append(makeElement('span', 'tag', label)));

  const meta = makeElement('div', 'repo-card-meta');
  if (repo.stargazers_count) meta.append(makeElement('span', '', `★ ${repo.stargazers_count}`));
  if (repo.archived) meta.append(makeElement('span', '', 'Archived'));

  const link = makeElement('a', 'project-link', 'Open repository ↗');
  link.href = repo.html_url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  card.append(top, title, description, tags, meta, link);
  return card;
};

const showFallback = () => {
  repoGrid.replaceChildren();
  repoGrid.setAttribute('aria-busy', 'false');
  const fallback = makeElement('p', 'repo-empty');
  fallback.append('GitHub could not be reached right now. ');
  const link = makeElement('a', '', 'View every public repository on GitHub ↗');
  link.href = githubProfile;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  fallback.append(link);
  repoGrid.append(fallback);
  repoStatus.textContent = 'Live sync temporarily unavailable';
};

if (repoGrid && repoStatus) {
  fetch(githubEndpoint, { headers: { Accept: 'application/vnd.github+json' } })
    .then((response) => {
      if (!response.ok) throw new Error(`GitHub responded with ${response.status}`);
      return response.json();
    })
    .then((repositories) => {
      const publicRepositories = repositories.filter((repo) => !repo.private);
      repoGrid.replaceChildren(...publicRepositories.map(makeRepoCard));
      repoGrid.setAttribute('aria-busy', 'false');
      repoStatus.textContent = `${publicRepositories.length} public repositories · Synced from GitHub`;
    })
    .catch(showFallback);
}
