import type { PrismaService } from './prisma/prisma.service';

export async function seedDatabase(prisma: PrismaService): Promise<void> {
  await seedRoles(prisma);
  await seedActivityIdeas(prisma);
  await seedIntakeSurvey(prisma);
}

async function seedRoles(prisma: PrismaService): Promise<void> {
  const roles = ['SuperDuperAdmin', 'Admin', 'User'];
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { normalizedName: roleName.toUpperCase() },
      update: {},
      create: { name: roleName, normalizedName: roleName.toUpperCase() },
    });
  }
}

async function seedActivityIdeas(prisma: PrismaService): Promise<void> {
  const count = await prisma.activityIdea.count();
  if (count > 0) return;

  await prisma.activityIdea.createMany({
    data: [
      { name: 'Coffee walk', description: 'Grab coffee and stroll around a lake or park.' },
      { name: 'Board game night', description: 'Meet at a board game café for a low-pressure evening.' },
      { name: 'Cooking class', description: 'Take an intro cooking class together.' },
      { name: 'Museum visit', description: 'Explore a local museum or art gallery.' },
      { name: 'Trivia night', description: 'Team up at a bar trivia event.' },
      { name: 'Farmers market', description: 'Browse a weekend farmers market together.' },
      { name: 'Outdoor hike', description: 'Hit a nearby trail for a casual hike.' },
      { name: 'Live music', description: 'Catch a local band or open mic night.' },
      { name: 'Picnic in the park', description: 'Pack snacks and enjoy a picnic.' },
      { name: 'Pottery class', description: 'Try a one-time pottery or ceramics workshop.' },
      { name: 'Escape room', description: 'Work together to solve an escape room.' },
      { name: 'Food truck hop', description: 'Sample food from different trucks around town.' },
    ],
  });
  console.log('  → Seeded activity ideas');
}

async function seedIntakeSurvey(prisma: PrismaService): Promise<void> {
  const existing = await prisma.survey.findFirst({ where: { slug: 'intake' } });
  if (existing) return;

  const survey = await prisma.survey.create({
    data: {
      name: 'Intake',
      slug: 'intake',
      description: 'Help us get to know you so we can find your best matches.',
    },
  });

  const version = await prisma.surveyVersion.create({
    data: {
      surveyId: survey.id,
      versionNumber: 1,
      isActive: true,
      publishedAt: new Date(),
    },
  });

  const questions = [
    { stableKey: 'about_you', group: 'About You', prompt: 'Tell us a little about yourself.', type: 'Text', required: true },
    { stableKey: 'gender', group: 'Preferences', prompt: 'What gender do you identify as?', type: 'SingleChoice', required: true },
    { stableKey: 'gender_preference', group: 'Preferences', prompt: 'What gender do you prefer to be matched with?', type: 'SingleChoice', required: true },
    { stableKey: 'interests', group: 'Preferences', prompt: 'Which activities interest you? (select all that apply)', type: 'MultipleChoice', required: true },
    { stableKey: 'availability', group: 'Logistics', prompt: 'When are you usually free to hang out?', type: 'MultipleChoice', required: true },
    { stableKey: 'anything_else', group: 'Logistics', prompt: "Anything else you'd like us to know?", type: 'Text', required: false },
  ];

  const optionsMap: Record<string, [string, string][]> = {
    gender: [['male', 'Male'], ['female', 'Female'], ['non-binary', 'Non-binary'], ['other', 'Other']],
    gender_preference: [['male', 'Male'], ['female', 'Female'], ['no-preference', 'No preference']],
    interests: [
      ['outdoor-activities', 'Outdoor activities'],
      ['food-drinks', 'Food & drinks'],
      ['arts-culture', 'Arts & culture'],
      ['sports-fitness', 'Sports & fitness'],
      ['board-games-trivia', 'Board games & trivia'],
      ['live-music-events', 'Live music & events'],
    ],
    availability: [
      ['weekday-mornings', 'Weekday mornings'],
      ['weekday-evenings', 'Weekday evenings'],
      ['weekend-mornings', 'Weekend mornings'],
      ['weekend-afternoons', 'Weekend afternoons'],
      ['weekend-evenings', 'Weekend evenings'],
    ],
  };

  for (const q of questions) {
    const question = await prisma.question.create({
      data: { stableKey: q.stableKey, questionGroup: q.group },
    });

    const qv = await prisma.questionVersion.create({
      data: {
        questionId: question.id,
        surveyVersionId: version.id,
        versionNumber: 1,
        prompt: q.prompt,
        questionType: q.type,
        required: q.required,
      },
    });

    const options = optionsMap[q.stableKey];
    if (options) {
      await prisma.questionOption.createMany({
        data: options.map(([value, displayValue], i) => ({
          questionVersionId: qv.id,
          value,
          displayValue,
          sortOrder: i,
        })),
      });
    }
  }

  console.log('  → Seeded intake survey');
}
