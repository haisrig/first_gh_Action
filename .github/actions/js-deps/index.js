const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');

const validateName = ({name}) => {
    if(!/^[a-zA-Z0-9_\-\.\/]+$/.test(name)) {
        core.setFailed(`Improper ${name} provided`);
    }
}


const setupGit = async() => {
    await exec.exec(`git config --global user.name "gh-automation"`);
    await exec.exec(`git config --global user.email "gh-automation@email.com"`);
}

async function run() {
    const baseBranch = core.getInput('base-branch');
    const targetBranch = core.getInput('target-branch');
    const workingDir = core.getInput('working-directory');
    const ghToken = core.getInput('gh-token');
    const gitExecOptions = {cwd: workingDir}
    core.info("This is a custom JS action");
    core.setSecret(ghToken);
    validateName(baseBranch);
    validateName(targetBranch);
    core.info(`[js-deps]: Base branch is ${baseBranch}`);
    core.info(`[js-deps]: Target branch is ${targetBranch}`);
    core.info(`[js-deps]: Working directory is ${workingDir}`);

    await exec.exec('npm update', [], gitExecOptions);
    const gitStatus = await exec.getExecOutput('git status -s package*.json', [], gitExecOptions);


    if(gitStatus.stdout.length > 0) {
        core.info("[js-deps]: NPM packages updated.");
        try {
            setupGit();
            await exec.exec(`git checkout -b ${targetBranch}`, [], gitExecOptions);
            await exec.exec(`git add package.json package-lock.json`, [], gitExecOptions);
            await exec.exec(`git commit -m "Update dependencies.`, [], gitExecOptions);
            await exec.exec(`git push -u origin ${targetBranch} --force`, [], gitExecOptions);
            core.info("Changes pushed to Github remote");
            const octakit = github.getOctokit(ghToken);
            await octakit.rest.pulls.create({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                title: "Update NPM packages",
                body: "Update NPM packages",
                baseBranch: baseBranch,
                head: targetBranch
            });
        } catch(e) {
            core.setFailed(e.message);
            core.error(e);
        }

    } else {
        core.info("[js-deps]: No update.");
    }
}

run();