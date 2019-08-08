
const isMasterPush = (pr) => {
  return pr.base.ref === 'master';
}

const shouldProcess = (pr) => {
  return !!pr.merged && isMasterPush(pr);
};

const createMdMessage = (pr) => {
  return {
    'owner': pr.head.repo.owner.login,
    'repo': pr.head.repo.name,
    'number': pr.number,
    'body': 'As you have made changes in .md files. Stay tuned, TechAtenea is shuttling your changes! 🚀🎉 '
  }
}

module.exports = app => {
  // Your code here
  app.log('Yay, the app was loaded!')

  app.on('pull_request.closed', async context => {
    // app.log(context)
    const pr = context.payload.pull_request;

    if (shouldProcess(pr)) {
      const compare = await context.github.repos.compareCommits(context.repo({
        base: pr.base.sha,
        head: pr.head.sha
      }));

      const hasMdChanges = compare.data.files.some(file => file.filename.endsWith('.md'));

      if (hasMdChanges) {
        context.github.issues.createComment(createMdMessage(pr))
      }


      // Parameters for the status API
      // const params = {
      //   sha: pr.head.sha,
      //   context: 'testTechAteneaApp',
      //   state: hasMdChanges ? 'success' : 'pending',
      //   description: `Your commit contains mdChanges`
      // }

      // Create the status
      // context.log('Adding status')
      // return context.github.repos.createStatus(context.repo(params));
    }

    // const issueComment = context.issue({ body: 'Thanks for opening this issue!' })
    // return context.github.issues.createComment(issueComment)
  })
}
