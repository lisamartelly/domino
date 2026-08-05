import { SurveysService } from './surveys.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SurveysService', () => {
  let service: SurveysService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prisma = {
      survey: { findFirst: jest.fn() },
      surveyVersion: { findFirst: jest.fn() },
      questionVersion: { findMany: jest.fn() },
      questionOption: { findMany: jest.fn() },
      surveyResponse: { findFirst: jest.fn(), create: jest.fn() },
      answer: { create: jest.fn(), findMany: jest.fn() },
      answerText: { create: jest.fn() },
      answerNumber: { create: jest.fn() },
      answerBoolean: { create: jest.fn() },
      answerChoice: { create: jest.fn() },
    } as unknown as jest.Mocked<PrismaService>;

    service = new SurveysService(prisma);
  });

  describe('getBySlug', () => {
    it('should return not_found when survey does not exist', async () => {
      (prisma.survey.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.getBySlug('nonexistent');

      expect(result.kind).toBe('not_found');
    });

    it('should return not_found when no active version exists', async () => {
      (prisma.survey.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.surveyVersion.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.getBySlug('intake');

      expect(result.kind).toBe('not_found');
    });

    it('should return survey with questions and options', async () => {
      (prisma.survey.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Intake Survey',
        slug: 'intake',
        description: 'Welcome survey',
      });
      (prisma.surveyVersion.findFirst as jest.Mock).mockResolvedValue({
        id: 10,
      });
      (prisma.questionVersion.findMany as jest.Mock).mockResolvedValue([
        {
          id: 100,
          prompt: 'What are your hobbies?',
          questionType: 'Text',
          required: true,
          question: { stableKey: 'hobbies', questionGroup: 'interests' },
        },
        {
          id: 101,
          prompt: 'Favorite color?',
          questionType: 'SingleChoice',
          required: false,
          question: { stableKey: 'color', questionGroup: 'preferences' },
        },
      ]);
      (prisma.questionOption.findMany as jest.Mock).mockResolvedValue([
        { id: 1, questionVersionId: 101, value: 'red', displayValue: 'Red', sortOrder: 1 },
        { id: 2, questionVersionId: 101, value: 'blue', displayValue: 'Blue', sortOrder: 2 },
      ]);

      const result = await service.getBySlug('intake');

      expect(result.kind).toBe('success');
      if (result.kind === 'success') {
        expect(result.value.name).toBe('Intake Survey');
        expect(result.value.questions).toHaveLength(2);
        expect(result.value.questions[0].options).toHaveLength(0);
        expect(result.value.questions[1].options).toHaveLength(2);
      }
    });
  });

  describe('submitResponse', () => {
    const setupValidSurvey = () => {
      (prisma.survey.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.surveyVersion.findFirst as jest.Mock).mockResolvedValue({ id: 10 });
      (prisma.surveyResponse.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.questionVersion.findMany as jest.Mock).mockResolvedValue([
        { id: 100, questionType: 'Text', required: true },
        { id: 101, questionType: 'Number', required: false },
      ]);
    };

    it('should return not_found when survey does not exist', async () => {
      (prisma.survey.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.submitResponse('nonexistent', 1, []);

      expect(result.kind).toBe('not_found');
    });

    it('should return not_found when no active version exists', async () => {
      (prisma.survey.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.surveyVersion.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.submitResponse('intake', 1, []);

      expect(result.kind).toBe('not_found');
    });

    it('should reject duplicate submission', async () => {
      (prisma.survey.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.surveyVersion.findFirst as jest.Mock).mockResolvedValue({ id: 10 });
      (prisma.surveyResponse.findFirst as jest.Mock).mockResolvedValue({ id: 5 });

      const result = await service.submitResponse('intake', 1, []);

      expect(result.kind).toBe('invalid');
      if (result.kind === 'invalid') {
        expect(result.message).toContain('already completed');
      }
    });

    it('should reject answers for unknown question versions', async () => {
      setupValidSurvey();

      const result = await service.submitResponse('intake', 1, [
        { questionVersionId: 999, textValue: 'test' },
      ]);

      expect(result.kind).toBe('invalid');
      if (result.kind === 'invalid') {
        expect(result.message).toContain('does not belong');
      }
    });

    it('should reject when required questions are unanswered', async () => {
      setupValidSurvey();

      const result = await service.submitResponse('intake', 1, [
        { questionVersionId: 101, numberValue: 42 },
      ]);

      expect(result.kind).toBe('invalid');
      if (result.kind === 'invalid') {
        expect(result.message).toContain('required');
      }
    });

    it('should create text answers', async () => {
      setupValidSurvey();
      (prisma.surveyResponse.create as jest.Mock).mockResolvedValue({ id: 50 });
      (prisma.answer.create as jest.Mock).mockResolvedValue({ id: 200 });
      (prisma.answerText.create as jest.Mock).mockResolvedValue({});

      const result = await service.submitResponse('intake', 1, [
        { questionVersionId: 100, textValue: 'Hiking and reading' },
      ]);

      expect(result.kind).toBe('success');
      expect(prisma.answerText.create).toHaveBeenCalledWith({
        data: { id: 200, value: 'Hiking and reading' },
      });
    });

    it('should create number answers', async () => {
      (prisma.survey.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.surveyVersion.findFirst as jest.Mock).mockResolvedValue({ id: 10 });
      (prisma.surveyResponse.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.questionVersion.findMany as jest.Mock).mockResolvedValue([
        { id: 100, questionType: 'Number', required: true },
      ]);
      (prisma.surveyResponse.create as jest.Mock).mockResolvedValue({ id: 50 });
      (prisma.answer.create as jest.Mock).mockResolvedValue({ id: 200 });
      (prisma.answerNumber.create as jest.Mock).mockResolvedValue({});

      const result = await service.submitResponse('intake', 1, [
        { questionVersionId: 100, numberValue: 42 },
      ]);

      expect(result.kind).toBe('success');
      expect(prisma.answerNumber.create).toHaveBeenCalledWith({
        data: { id: 200, value: 42 },
      });
    });

    it('should create boolean answers', async () => {
      (prisma.survey.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.surveyVersion.findFirst as jest.Mock).mockResolvedValue({ id: 10 });
      (prisma.surveyResponse.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.questionVersion.findMany as jest.Mock).mockResolvedValue([
        { id: 100, questionType: 'Boolean', required: true },
      ]);
      (prisma.surveyResponse.create as jest.Mock).mockResolvedValue({ id: 50 });
      (prisma.answer.create as jest.Mock).mockResolvedValue({ id: 200 });
      (prisma.answerBoolean.create as jest.Mock).mockResolvedValue({});

      const result = await service.submitResponse('intake', 1, [
        { questionVersionId: 100, booleanValue: true },
      ]);

      expect(result.kind).toBe('success');
      expect(prisma.answerBoolean.create).toHaveBeenCalledWith({
        data: { id: 200, value: true },
      });
    });

    it('should create single choice answers', async () => {
      (prisma.survey.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.surveyVersion.findFirst as jest.Mock).mockResolvedValue({ id: 10 });
      (prisma.surveyResponse.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.questionVersion.findMany as jest.Mock).mockResolvedValue([
        { id: 100, questionType: 'SingleChoice', required: true },
      ]);
      (prisma.surveyResponse.create as jest.Mock).mockResolvedValue({ id: 50 });
      (prisma.answer.create as jest.Mock).mockResolvedValue({ id: 200 });
      (prisma.answerChoice.create as jest.Mock).mockResolvedValue({});

      const result = await service.submitResponse('intake', 1, [
        { questionVersionId: 100, selectedOptionIds: [5] },
      ]);

      expect(result.kind).toBe('success');
      expect(prisma.answerChoice.create).toHaveBeenCalledWith({
        data: { id: 200, selectedQuestionOptionId: 5 },
      });
    });

    it('should create multiple choice answers with multiple rows', async () => {
      (prisma.survey.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.surveyVersion.findFirst as jest.Mock).mockResolvedValue({ id: 10 });
      (prisma.surveyResponse.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.questionVersion.findMany as jest.Mock).mockResolvedValue([
        { id: 100, questionType: 'MultipleChoice', required: true },
      ]);
      (prisma.surveyResponse.create as jest.Mock).mockResolvedValue({ id: 50 });
      (prisma.answer.create as jest.Mock)
        .mockResolvedValueOnce({ id: 200 })
        .mockResolvedValueOnce({ id: 201 });
      (prisma.answerChoice.create as jest.Mock).mockResolvedValue({});

      const result = await service.submitResponse('intake', 1, [
        { questionVersionId: 100, selectedOptionIds: [3, 7] },
      ]);

      expect(result.kind).toBe('success');
      expect(prisma.answer.create).toHaveBeenCalledTimes(2);
      expect(prisma.answerChoice.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('getUserResponse', () => {
    it('should return not_found when no response exists', async () => {
      (prisma.surveyResponse.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.getUserResponse('intake', 1);

      expect(result.kind).toBe('not_found');
    });

    it('should return formatted response with text answers', async () => {
      (prisma.surveyResponse.findFirst as jest.Mock).mockResolvedValue({
        id: 50,
        createdAt: new Date('2026-01-15T10:00:00Z'),
        surveyVersion: { survey: { name: 'Intake Survey' } },
      });
      (prisma.answer.findMany as jest.Mock).mockResolvedValue([
        {
          questionVersionId: 100,
          questionVersion: {
            prompt: 'What are your hobbies?',
            questionType: 'Text',
            question: { questionGroup: 'interests' },
          },
          answerText: { value: 'Hiking' },
          answerNumber: null,
          answerBoolean: null,
          answerChoice: null,
        },
      ]);

      const result = await service.getUserResponse('intake', 1);

      expect(result.kind).toBe('success');
      if (result.kind === 'success') {
        expect(result.value.surveyName).toBe('Intake Survey');
        expect(result.value.answers).toHaveLength(1);
        expect(result.value.answers[0].answer).toBe('Hiking');
      }
    });

    it('should format boolean answers as Yes/No', async () => {
      (prisma.surveyResponse.findFirst as jest.Mock).mockResolvedValue({
        id: 50,
        createdAt: new Date(),
        surveyVersion: { survey: { name: 'Survey' } },
      });
      (prisma.answer.findMany as jest.Mock).mockResolvedValue([
        {
          questionVersionId: 100,
          questionVersion: {
            prompt: 'Open to romance?',
            questionType: 'Boolean',
            question: { questionGroup: 'prefs' },
          },
          answerText: null,
          answerNumber: null,
          answerBoolean: { value: true },
          answerChoice: null,
        },
      ]);

      const result = await service.getUserResponse('intake', 1);

      expect(result.kind).toBe('success');
      if (result.kind === 'success') {
        expect(result.value.answers[0].answer).toBe('Yes');
      }
    });

    it('should format number answers as strings', async () => {
      (prisma.surveyResponse.findFirst as jest.Mock).mockResolvedValue({
        id: 50,
        createdAt: new Date(),
        surveyVersion: { survey: { name: 'Survey' } },
      });
      (prisma.answer.findMany as jest.Mock).mockResolvedValue([
        {
          questionVersionId: 100,
          questionVersion: {
            prompt: 'Your age?',
            questionType: 'Number',
            question: { questionGroup: 'demo' },
          },
          answerText: null,
          answerNumber: { value: 30 },
          answerBoolean: null,
          answerChoice: null,
        },
      ]);

      const result = await service.getUserResponse('intake', 1);

      expect(result.kind).toBe('success');
      if (result.kind === 'success') {
        expect(result.value.answers[0].answer).toBe('30');
      }
    });

    it('should join multiple choice display values', async () => {
      (prisma.surveyResponse.findFirst as jest.Mock).mockResolvedValue({
        id: 50,
        createdAt: new Date(),
        surveyVersion: { survey: { name: 'Survey' } },
      });
      (prisma.answer.findMany as jest.Mock).mockResolvedValue([
        {
          questionVersionId: 100,
          questionVersion: {
            prompt: 'Looking for?',
            questionType: 'MultipleChoice',
            question: { questionGroup: 'goals' },
          },
          answerText: null,
          answerNumber: null,
          answerBoolean: null,
          answerChoice: { selectedQuestionOptionId: 1, questionOption: { displayValue: 'Friends' } },
        },
        {
          questionVersionId: 100,
          questionVersion: {
            prompt: 'Looking for?',
            questionType: 'MultipleChoice',
            question: { questionGroup: 'goals' },
          },
          answerText: null,
          answerNumber: null,
          answerBoolean: null,
          answerChoice: { selectedQuestionOptionId: 2, questionOption: { displayValue: 'Community' } },
        },
      ]);

      const result = await service.getUserResponse('intake', 1);

      expect(result.kind).toBe('success');
      if (result.kind === 'success') {
        expect(result.value.answers).toHaveLength(1);
        expect(result.value.answers[0].answer).toBe('Friends, Community');
      }
    });
  });
});
