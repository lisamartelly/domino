const AVATAR_COUNT = 7;

export function getAvatarUrl(userId: number): string {
  const index = (userId % AVATAR_COUNT) + 1;
  return `/images/avatars/Smiley${index}_Charcoal.png`;
}
