import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { ServiceResult } from '../common/service-result';
import { success, notFound, invalid } from '../common/service-result';
import type {
  SurveyDto,
  QuestionDto,
  SurveyResponseDto,
  SurveyAnswerDto,
  SubmitAnswerRequest,
} from './dto/survey.dto';

@Injectable()
export class SurveysService {
  constructor(private readonly prisma: PrismaService) {}

  async getBySlug(slug: string): Promise<ServiceResult<SurveyDto>> {
    const survey = await this.prisma.survey.findFirst({
      where: { slug },
    });

    if (!survey) {
      return notFound('Survey not found.');
    }

    const activeVersion = await this.prisma.surveyVersion.findFirst({
      where: {
        surveyId: survey.id,
        isActive: true,
        publishedAt: { not: null },
      },
    });

    if (!activeVersion) {
      return notFound('No active survey version found.');
    }

    const questionVersions = await this.prisma.questionVersion.findMany({
      where: { surveyVersionId: activeVersion.id },
      include: { question: true },
      orderBy: { id: 'asc' },
    });

    const qvIds = questionVersions.map((qv) => qv.id);

    const options = await this.prisma.questionOption.findMany({
      where: { questionVersionId: { in: qvIds } },
      orderBy: { sortOrder: 'asc' },
    });

    const optionsByQv = new Map<number, typeof options>();
    for (const opt of options) {
      const arr = optionsByQv.get(opt.questionVersionId) ?? [];
      arr.push(opt);
      optionsByQv.set(opt.questionVersionId, arr);
    }

    const questions: QuestionDto[] = questionVersions.map((qv) => ({
      questionVersionId: qv.id,
      stableKey: qv.question.stableKey,
      questionGroup: qv.question.questionGroup,
      prompt: qv.prompt,
      questionType: qv.questionType,
      required: qv.required,
      options: (optionsByQv.get(qv.id) ?? []).map((o) => ({
        id: o.id,
        value: o.value,
        displayValue: o.displayValue,
        sortOrder: o.sortOrder,
      })),
    }));

    return success({
      id: survey.id,
      name: survey.name,
      slug: survey.slug,
      description: survey.description,
      versionId: activeVersion.id,
      questions,
    });
  }

  async submitResponse(
    slug: string,
    userId: number,
    answers: SubmitAnswerRequest[],
  ): Promise<ServiceResult<boolean>> {
    const survey = await this.prisma.survey.findFirst({ where: { slug } });
    if (!survey) {
      return notFound('Survey not found.');
    }

    const activeVersion = await this.prisma.surveyVersion.findFirst({
      where: {
        surveyId: survey.id,
        isActive: true,
        publishedAt: { not: null },
      },
    });

    if (!activeVersion) {
      return notFound('No active survey version found.');
    }

    const alreadySubmitted = await this.prisma.surveyResponse.findFirst({
      where: { userId, surveyVersionId: activeVersion.id },
    });

    if (alreadySubmitted) {
      return invalid('You have already completed this survey.');
    }

    const questionVersions = await this.prisma.questionVersion.findMany({
      where: { surveyVersionId: activeVersion.id },
    });

    const qvMap = new Map(questionVersions.map((qv) => [qv.id, qv]));

    for (const answer of answers) {
      if (!qvMap.has(answer.questionVersionId)) {
        return invalid(
          `Question version ${answer.questionVersionId} does not belong to this survey.`,
        );
      }
    }

    const requiredIds = new Set(
      questionVersions.filter((qv) => qv.required).map((qv) => qv.id),
    );
    const answeredIds = new Set(answers.map((a) => a.questionVersionId));
    const missing = [...requiredIds].filter((id) => !answeredIds.has(id));

    if (missing.length > 0) {
      return invalid('Not all required questions have been answered.');
    }

    // Create survey response
    const response = await this.prisma.surveyResponse.create({
      data: { userId, surveyVersionId: activeVersion.id },
    });

    // Create answers
    for (const answer of answers) {
      const qv = qvMap.get(answer.questionVersionId)!;

      if (qv.questionType === 'MultipleChoice') {
        for (const optionId of answer.selectedOptionIds ?? []) {
          const base = await this.prisma.answer.create({
            data: {
              surveyResponseId: response.id,
              questionVersionId: answer.questionVersionId,
            },
          });
          await this.prisma.answerChoice.create({
            data: { id: base.id, selectedQuestionOptionId: optionId },
          });
        }
        continue;
      }

      const base = await this.prisma.answer.create({
        data: {
          surveyResponseId: response.id,
          questionVersionId: answer.questionVersionId,
        },
      });

      switch (qv.questionType) {
        case 'Text':
          await this.prisma.answerText.create({
            data: { id: base.id, value: answer.textValue ?? '' },
          });
          break;
        case 'Number':
          await this.prisma.answerNumber.create({
            data: { id: base.id, value: answer.numberValue ?? 0 },
          });
          break;
        case 'Boolean':
          await this.prisma.answerBoolean.create({
            data: { id: base.id, value: answer.booleanValue ?? false },
          });
          break;
        case 'SingleChoice':
          await this.prisma.answerChoice.create({
            data: {
              id: base.id,
              selectedQuestionOptionId:
                answer.selectedOptionIds?.[0] ?? 0,
            },
          });
          break;
      }
    }

    return success(true);
  }

  async getUserResponse(
    slug: string,
    userId: number,
  ): Promise<ServiceResult<SurveyResponseDto>> {
    const surveyResponse = await this.prisma.surveyResponse.findFirst({
      where: {
        userId,
        surveyVersion: { survey: { slug } },
      },
      include: {
        surveyVersion: { include: { survey: true } },
      },
    });

    if (!surveyResponse) {
      return notFound('No response found for this user and survey.');
    }

    const answers = await this.prisma.answer.findMany({
      where: { surveyResponseId: surveyResponse.id },
      include: {
        questionVersion: { include: { question: true } },
        answerText: true,
        answerNumber: true,
        answerBoolean: true,
        answerChoice: { include: { questionOption: true } },
      },
      orderBy: { questionVersionId: 'asc' },
    });

    // Group answers by questionVersionId (multiple choice has multiple rows)
    const grouped = new Map<number, typeof answers>();
    for (const a of answers) {
      const arr = grouped.get(a.questionVersionId) ?? [];
      arr.push(a);
      grouped.set(a.questionVersionId, arr);
    }

    const surveyAnswers: SurveyAnswerDto[] = [];

    for (const [, group] of grouped) {
      const first = group[0];
      const qv = first.questionVersion;

      let displayValue: string | null = null;

      if (first.answerText) {
        displayValue = first.answerText.value;
      } else if (first.answerNumber) {
        displayValue = first.answerNumber.value.toString();
      } else if (first.answerBoolean) {
        displayValue = first.answerBoolean.value ? 'Yes' : 'No';
      } else if (first.answerChoice) {
        displayValue = group
          .filter((a) => a.answerChoice)
          .map(
            (a) =>
              a.answerChoice!.questionOption.displayValue ??
              a.answerChoice!.selectedQuestionOptionId.toString(),
          )
          .join(', ');
      }

      surveyAnswers.push({
        prompt: qv.prompt,
        questionGroup: qv.question.questionGroup,
        questionType: qv.questionType,
        answer: displayValue,
      });
    }

    return success({
      surveyName: surveyResponse.surveyVersion.survey.name,
      completedAt: surveyResponse.createdAt,
      answers: surveyAnswers,
    });
  }
}
