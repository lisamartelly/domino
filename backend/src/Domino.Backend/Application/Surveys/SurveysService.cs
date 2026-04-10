using Domino.Backend.Application.Surveys.Enums;
using Domino.Backend.Application.Surveys.Models;
using Domino.Backend.Utilities;
using Microsoft.EntityFrameworkCore;

namespace Domino.Backend.Application.Surveys;

public class SurveysService(DominoDbContext db) : ISurveysService
{
    public async Task<ServiceResult<SurveyDto>> GetBySlugAsync(string slug)
    {
        var survey = await db.Surveys
            .FirstOrDefaultAsync(s => s.Slug == slug);

        if (survey is null)
        {
            return ServiceResult.NotFound<SurveyDto>("Survey not found.");
        }

        var activeVersion = await db.Set<SurveyVersionModel>()
            .FirstOrDefaultAsync(sv => sv.SurveyId == survey.Id
                && sv.IsActive
                && sv.PublishedAt != null);

        if (activeVersion is null)
        {
            return ServiceResult.NotFound<SurveyDto>("No active survey version found.");
        }

        var questionVersions = await db.Set<QuestionVersionModel>()
            .Where(qv => qv.SurveyVersionId == activeVersion.Id)
            .Include(qv => qv.Question)
            .OrderBy(qv => qv.Id)
            .ToListAsync();

        var questionVersionIds = questionVersions.Select(qv => qv.Id).ToList();

        var options = await db.Set<QuestionOptionModel>()
            .Where(o => questionVersionIds.Contains(o.QuestionVersionId))
            .OrderBy(o => o.SortOrder)
            .ToListAsync();

        var optionsByQuestionVersion = options
            .GroupBy(o => o.QuestionVersionId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var questions = questionVersions.Select(qv => new QuestionDto
        {
            QuestionVersionId = qv.Id,
            StableKey = qv.Question!.StableKey,
            QuestionGroup = qv.Question.QuestionGroup,
            Prompt = qv.Prompt,
            QuestionType = qv.QuestionType.ToString(),
            Required = qv.Required,
            Options = (optionsByQuestionVersion.GetValueOrDefault(qv.Id) ?? [])
                .Select(o => new QuestionOptionDto
                {
                    Id = o.Id,
                    Value = o.Value,
                    DisplayValue = o.DisplayValue,
                    SortOrder = o.SortOrder
                }).ToList()
        }).ToList();

        return ServiceResult.Success(new SurveyDto
        {
            Id = survey.Id,
            Name = survey.Name,
            Slug = survey.Slug,
            Description = survey.Description,
            VersionId = activeVersion.Id,
            Questions = questions
        });
    }

    public async Task<ServiceResult<bool>> SubmitResponseAsync(string slug, int userId, List<SubmitAnswerRequest> answers)
    {
        var survey = await db.Surveys
            .FirstOrDefaultAsync(s => s.Slug == slug);

        if (survey is null)
        {
            return ServiceResult.NotFound<bool>("Survey not found.");
        }

        var activeVersion = await db.Set<SurveyVersionModel>()
            .FirstOrDefaultAsync(sv => sv.SurveyId == survey.Id
                && sv.IsActive
                && sv.PublishedAt != null);

        if (activeVersion is null)
        {
            return ServiceResult.NotFound<bool>("No active survey version found.");
        }

        var alreadySubmitted = await db.Set<SurveyResponseModel>()
            .AnyAsync(sr => sr.UserId == userId && sr.SurveyVersionId == activeVersion.Id);

        if (alreadySubmitted)
        {
            return ServiceResult.Invalid<bool>("You have already completed this survey.");
        }

        var questionVersions = await db.Set<QuestionVersionModel>()
            .Where(qv => qv.SurveyVersionId == activeVersion.Id)
            .ToListAsync();

        var questionVersionMap = questionVersions.ToDictionary(qv => qv.Id);

        foreach (var answer in answers)
        {
            if (!questionVersionMap.ContainsKey(answer.QuestionVersionId))
            {
                return ServiceResult.Invalid<bool>(
                    $"Question version {answer.QuestionVersionId} does not belong to this survey.");
            }
        }

        var requiredQuestionIds = questionVersions
            .Where(qv => qv.Required)
            .Select(qv => qv.Id)
            .ToHashSet();

        var answeredQuestionIds = answers.Select(a => a.QuestionVersionId).ToHashSet();

        var missingRequired = requiredQuestionIds.Except(answeredQuestionIds).ToList();
        if (missingRequired.Count > 0)
        {
            return ServiceResult.Invalid<bool>("Not all required questions have been answered.");
        }

        var response = new SurveyResponseModel
        {
            UserId = userId,
            SurveyVersionId = activeVersion.Id
        };

        db.Set<SurveyResponseModel>().Add(response);
        await db.SaveChangesAsync();

        foreach (var answer in answers)
        {
            var qv = questionVersionMap[answer.QuestionVersionId];

            if (qv.QuestionType == QuestionType.MultipleChoice)
            {
                foreach (var optionId in answer.SelectedOptionIds ?? [])
                {
                    db.Set<AnswerChoiceModel>().Add(new AnswerChoiceModel
                    {
                        SurveyResponseId = response.Id,
                        QuestionVersionId = answer.QuestionVersionId,
                        SelectedQuestionOptionId = optionId
                    });
                }
                continue;
            }

            AnswerModel entity = qv.QuestionType switch
            {
                QuestionType.Text => new AnswerTextModel
                {
                    SurveyResponseId = response.Id,
                    QuestionVersionId = answer.QuestionVersionId,
                    Value = answer.TextValue ?? ""
                },
                QuestionType.Number => new AnswerNumberModel
                {
                    SurveyResponseId = response.Id,
                    QuestionVersionId = answer.QuestionVersionId,
                    Value = answer.NumberValue ?? 0
                },
                QuestionType.Boolean => new AnswerBooleanModel
                {
                    SurveyResponseId = response.Id,
                    QuestionVersionId = answer.QuestionVersionId,
                    Value = answer.BooleanValue ?? false
                },
                QuestionType.SingleChoice => new AnswerChoiceModel
                {
                    SurveyResponseId = response.Id,
                    QuestionVersionId = answer.QuestionVersionId,
                    SelectedQuestionOptionId = answer.SelectedOptionIds?.FirstOrDefault() ?? 0
                },
                _ => throw new InvalidOperationException($"Unknown question type: {qv.QuestionType}")
            };

            db.Set<AnswerModel>().Add(entity);
        }

        await db.SaveChangesAsync();

        return ServiceResult.Success(true);
    }

    public async Task<ServiceResult<SurveyResponseDto>> GetUserResponseAsync(string slug, int userId)
    {
        var surveyResponse = await db.Set<SurveyResponseModel>()
            .Include(sr => sr.SurveyVersion!)
                .ThenInclude(sv => sv.Survey!)
            .FirstOrDefaultAsync(sr =>
                sr.UserId == userId
                && sr.SurveyVersion!.Survey!.Slug == slug);

        if (surveyResponse is null)
        {
            return ServiceResult.NotFound<SurveyResponseDto>("No response found for this user and survey.");
        }

        var answers = await db.Set<AnswerModel>()
            .Where(a => a.SurveyResponseId == surveyResponse.Id)
            .Include(a => a.QuestionVersion!)
                .ThenInclude(qv => qv.Question!)
            .ToListAsync();

        var choiceAnswers = answers.OfType<AnswerChoiceModel>().ToList();
        var optionIds = choiceAnswers.Select(a => a.SelectedQuestionOptionId).Distinct().ToList();
        var optionLookup = optionIds.Count > 0
            ? await db.Set<QuestionOptionModel>()
                .Where(o => optionIds.Contains(o.Id))
                .ToDictionaryAsync(o => o.Id, o => o.DisplayValue)
            : new Dictionary<int, string>();

        var answersByQuestion = answers
            .GroupBy(a => a.QuestionVersionId)
            .OrderBy(g => g.Key)
            .Select(g =>
            {
                var first = g.First();
                var qv = first.QuestionVersion!;
                string? displayValue = first switch
                {
                    AnswerTextModel t => t.Value,
                    AnswerNumberModel n => n.Value.ToString("G", System.Globalization.CultureInfo.InvariantCulture),
                    AnswerBooleanModel b => b.Value ? "Yes" : "No",
                    AnswerChoiceModel => string.Join(", ",
                        g.OfType<AnswerChoiceModel>()
                         .Select(c => optionLookup.GetValueOrDefault(c.SelectedQuestionOptionId, c.SelectedQuestionOptionId.ToString(System.Globalization.CultureInfo.InvariantCulture)))),
                    _ => null,
                };

                return new SurveyAnswerDto
                {
                    Prompt = qv.Prompt,
                    QuestionGroup = qv.Question?.QuestionGroup,
                    QuestionType = qv.QuestionType.ToString(),
                    Answer = displayValue,
                };
            })
            .ToList();

        return ServiceResult.Success(new SurveyResponseDto
        {
            SurveyName = surveyResponse.SurveyVersion!.Survey!.Name,
            CompletedAt = surveyResponse.CreatedAt,
            Answers = answersByQuestion,
        });
    }
}
