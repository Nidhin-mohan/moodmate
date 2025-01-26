// logger.ts

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

export const logger = {
  start: (taskName: string) => {
    const timestamp = new Date().toISOString();
    console.log(
      `${colors.cyan}[${timestamp}] ${colors.green}Starting task: ${taskName}${colors.reset}`
    );
  },

  complete: (taskName: string) => {
    const timestamp = new Date().toISOString();
    console.log(
      `${colors.cyan}[${timestamp}] ${colors.green}Completed task: ${taskName}${colors.reset}`
    );
  },

  error: (taskName: string, error: string) => {
    const timestamp = new Date().toISOString();
    console.error(
      `${colors.cyan}[${timestamp}] ${colors.red}Error in task: ${taskName} - ${error}${colors.reset}`
    );
  },
};
