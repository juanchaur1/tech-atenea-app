
module.exports = app => {
  // Your code here
  app.log('Yay, the app was loaded!')

  app.on('pull_request.closed', async context => {
    app.log(context)

    const headRepoId = context.payload.pull_request.head.repo.id
    const baseRepoId = context.payload.pull_request.base.repo.id

    app.log(`HeadRepoId: ${headRepoId}`)
    app.log(`baseRepoId: ${baseRepoId}`)


    if (!context.payload.pull_request.merged) {
      context.log.info(`PR was closed but not merged. Keeping`)
    }
    
    // const issueComment = context.issue({ body: 'Thanks for opening this issue!' })
    // return context.github.issues.createComment(issueComment)
  })
}
