const getConfig = require('probot-config');
const jenkinsapi = require('jenkins-api');

const techAteneaUri = 'https://bobthebuilder.marfeel.com:8443/view/TechAtenea/job/TechAtenea-Shuttle/';
const commentMsg = `You've made changes in .md files 🎉.
Stay tuned, [TechAtenea is shuttling your changes! 🚀](${techAteneaUri})`;

const isMasterPush = (pr) => {
  return !!pr.merged && pr.base.ref === 'master';
}

const hasMdChanges = async (context, pr) => {
  const compare = await context.github.repos.compareCommits(context.repo({
    base: pr.base.sha,
    head: pr.head.sha
  }));

  return compare.data.files.some(file => file.filename.endsWith('.md'));
}

const shouldProcess = async (context, pr) => {
  return isMasterPush(pr) && hasMdChanges(context, pr);
};

module.exports = app => {
  app.log('Yay, the app was loaded!')

  const router = app.route('/my-app')
  router.use(require('express').static('public'))

  app.on('pull_request.closed', async context => {
    // Load config from .github/jenkins.yml in the repository
    const jenkinsConfig = await getConfig(context, 'config.yml')

    // app.log('PR closed request received!')
    // app.log(jenkinsConfig.close)

    const isValid = await shouldProcess(context, context.payload.pull_request);

    if (isValid && !!jenkinsConfig) {
      context.github.issues.createComment(context.issue({ body: commentMsg }));

      const jenkins = jenkinsapi.init(`https://${jenkinsConfig.user}:${jenkinsConfig.token}@${jenkinsConfig.base}`);

      jenkins.build('TechAtenea-Shuttle', (err, data) => {
        if (err) {
          app.log(err);

          return app.log(err);
        }
        app.log(data)
      });
    }
  })
}
