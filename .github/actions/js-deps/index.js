import core from '@actions/core';
import exec from '@actions/exec';

const validateName = ({name}) => {
    if(!/^[a-zA-Z0-9_\-\.\/]+$/.test(name)) {
        core.setFailed(`Improper ${name} provided`);
    }
}

async function run() {
    const baseBranch = core.getInput('base-branch');
    const targetBranch = core.getInput('target-branch');
    const workingDir = core.getInput('working-directory');
    const ghToken = core.getInput('gh-token');
    core.info("This is a custom JS action");
    core.setSecret(ghToken);
    validateName(baseBranch);
    validateName(targetBranch);
    core.info(`[js-deps]: Base branch is ${baseBranch}`);
    core.info(`[js-deps]: Target branch is ${targetBranch}`);
    core.info(`[js-deps]: Working directory is ${workingDir}`);

    await exec.exec('npm update', [], {cwd: workingDir});
    const gitStatus = await exec.getExecOutput('git status -s package*.json', [], {cwd: workingDir});
    if(gitStatus.stdout.length > 0) {
        core.info("[js-deps]: NPM packages updated.");
    } else {
        core.info("[js-deps]: No update.");
    }
}

run();