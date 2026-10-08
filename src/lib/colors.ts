// One colour per project, in order. Used for its card frame, its page banner and its result tile.
export const PROJECT_COLORS = ['pink', 'blue', 'green', 'purple', 'slate'] as const;
export const projectColor = (index: number): (typeof PROJECT_COLORS)[number] => PROJECT_COLORS[index % PROJECT_COLORS.length]!;
