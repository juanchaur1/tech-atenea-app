const jenkinsapi = require('jenkins-api');

const techAteneaUri = 'https://bobthebuilder.marfeel.com:8443/view/TechAtenea/job/TechAtenea-Shuttle/';

const prMergedComment = `You've made changes in .md files 🎉.
Stay tuned, [TechAtenea is shuttling your changes!](${techAteneaUri})🚀`;

const prOpenComment = `:warning:Be aware your changes will trigger a TechAtenea shuttle as there are changes in *.md files!`;

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

const fireJenkinsBuild = async (app, jenkinsConfig) => {
  const jenkins = jenkinsapi.init(`https://${jenkinsConfig.user}:${jenkinsConfig.token}@${jenkinsConfig.base}`);

  jenkins.build('TechAtenea-Shuttle', (err, data) => {
    if (err) {
      app.log(err);

      return app.log(err);
    }
    app.log(data);
  });
};

module.exports = app => {
  app.log('Yay, the app was loaded!');

  const jenkinsConfig = {
    user: process.env.JENKINS_USER,
    token: process.env.JENKINS_TOKEN,
    base: 'bobthebuilder.marfeel.com:8443'
  };

  app.on('pull_request.opened', async context => {
    const isValid = await hasMdChanges(context, context.payload.pull_request);

    if (isValid) {
      context.github.issues.createComment(context.issue({ body: prOpenComment }));
    }
  });

  app.on('pull_request.closed', async context => {
    const isValid = await shouldProcess(context, context.payload.pull_request);

    if (isValid && !!jenkinsConfig) {
      context.github.issues.createComment(context.issue({ body: prMergedComment }));
      await fireJenkinsBuild(app, jenkinsConfig);
    }
  });
}
