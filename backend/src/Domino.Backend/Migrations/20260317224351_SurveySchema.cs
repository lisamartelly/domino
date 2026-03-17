using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Domino.Backend.Migrations;

/// <inheritdoc />
public partial class SurveySchema : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "features",
            columns: table => new
            {
                id = table.Column<int>(type: "integer", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                description = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_features", x => x.id);
            });

        migrationBuilder.CreateTable(
            name: "questions",
            columns: table => new
            {
                id = table.Column<int>(type: "integer", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                stable_key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                question_group = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_questions", x => x.id);
            });

        migrationBuilder.CreateTable(
            name: "surveys",
            columns: table => new
            {
                id = table.Column<int>(type: "integer", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                description = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_surveys", x => x.id);
            });

        migrationBuilder.CreateTable(
            name: "survey_versions",
            columns: table => new
            {
                id = table.Column<int>(type: "integer", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                survey_id = table.Column<int>(type: "integer", nullable: false),
                version_number = table.Column<int>(type: "integer", nullable: false),
                published_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                is_active = table.Column<bool>(type: "boolean", nullable: false),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_survey_versions", x => x.id);
                table.ForeignKey(
                    name: "FK_survey_versions_surveys_survey_id",
                    column: x => x.survey_id,
                    principalTable: "surveys",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "question_versions",
            columns: table => new
            {
                id = table.Column<int>(type: "integer", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                question_id = table.Column<int>(type: "integer", nullable: false),
                survey_version_id = table.Column<int>(type: "integer", nullable: false),
                version_number = table.Column<int>(type: "integer", nullable: false),
                prompt = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                question_type = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                required = table.Column<bool>(type: "boolean", nullable: false),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_question_versions", x => x.id);
                table.ForeignKey(
                    name: "FK_question_versions_questions_question_id",
                    column: x => x.question_id,
                    principalTable: "questions",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_question_versions_survey_versions_survey_version_id",
                    column: x => x.survey_version_id,
                    principalTable: "survey_versions",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "survey_responses",
            columns: table => new
            {
                id = table.Column<int>(type: "integer", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                user_id = table.Column<int>(type: "integer", nullable: false),
                survey_version_id = table.Column<int>(type: "integer", nullable: false),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_survey_responses", x => x.id);
                table.ForeignKey(
                    name: "FK_survey_responses_survey_versions_survey_version_id",
                    column: x => x.survey_version_id,
                    principalTable: "survey_versions",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_survey_responses_users_user_id",
                    column: x => x.user_id,
                    principalTable: "users",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "question_feature_maps",
            columns: table => new
            {
                id = table.Column<int>(type: "integer", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                question_version_id = table.Column<int>(type: "integer", nullable: false),
                feature_id = table.Column<int>(type: "integer", nullable: false),
                transform_json = table.Column<string>(type: "text", nullable: false),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_question_feature_maps", x => x.id);
                table.ForeignKey(
                    name: "FK_question_feature_maps_features_feature_id",
                    column: x => x.feature_id,
                    principalTable: "features",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_question_feature_maps_question_versions_question_version_id",
                    column: x => x.question_version_id,
                    principalTable: "question_versions",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "question_options",
            columns: table => new
            {
                id = table.Column<int>(type: "integer", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                question_version_id = table.Column<int>(type: "integer", nullable: false),
                value = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                display_value = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                sort_order = table.Column<int>(type: "integer", nullable: false),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_question_options", x => x.id);
                table.ForeignKey(
                    name: "FK_question_options_question_versions_question_version_id",
                    column: x => x.question_version_id,
                    principalTable: "question_versions",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "answers",
            columns: table => new
            {
                id = table.Column<int>(type: "integer", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                survey_response_id = table.Column<int>(type: "integer", nullable: false),
                question_version_id = table.Column<int>(type: "integer", nullable: false),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_answers", x => x.id);
                table.ForeignKey(
                    name: "FK_answers_question_versions_question_version_id",
                    column: x => x.question_version_id,
                    principalTable: "question_versions",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_answers_survey_responses_survey_response_id",
                    column: x => x.survey_response_id,
                    principalTable: "survey_responses",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "answer_booleans",
            columns: table => new
            {
                id = table.Column<int>(type: "integer", nullable: false),
                value = table.Column<bool>(type: "boolean", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_answer_booleans", x => x.id);
                table.ForeignKey(
                    name: "FK_answer_booleans_answers_id",
                    column: x => x.id,
                    principalTable: "answers",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "answer_choices",
            columns: table => new
            {
                id = table.Column<int>(type: "integer", nullable: false),
                selected_question_option_id = table.Column<int>(type: "integer", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_answer_choices", x => x.id);
                table.ForeignKey(
                    name: "FK_answer_choices_answers_id",
                    column: x => x.id,
                    principalTable: "answers",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_answer_choices_question_options_selected_question_option_id",
                    column: x => x.selected_question_option_id,
                    principalTable: "question_options",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "answer_numbers",
            columns: table => new
            {
                id = table.Column<int>(type: "integer", nullable: false),
                value = table.Column<decimal>(type: "numeric(10,4)", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_answer_numbers", x => x.id);
                table.ForeignKey(
                    name: "FK_answer_numbers_answers_id",
                    column: x => x.id,
                    principalTable: "answers",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "answer_texts",
            columns: table => new
            {
                id = table.Column<int>(type: "integer", nullable: false),
                value = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_answer_texts", x => x.id);
                table.ForeignKey(
                    name: "FK_answer_texts_answers_id",
                    column: x => x.id,
                    principalTable: "answers",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_answer_choices_selected_question_option_id",
            table: "answer_choices",
            column: "selected_question_option_id");

        migrationBuilder.CreateIndex(
            name: "IX_answers_question_version_id",
            table: "answers",
            column: "question_version_id");

        migrationBuilder.CreateIndex(
            name: "IX_answers_survey_response_id",
            table: "answers",
            column: "survey_response_id");

        migrationBuilder.CreateIndex(
            name: "IX_question_feature_maps_feature_id",
            table: "question_feature_maps",
            column: "feature_id");

        migrationBuilder.CreateIndex(
            name: "IX_question_feature_maps_question_version_id",
            table: "question_feature_maps",
            column: "question_version_id");

        migrationBuilder.CreateIndex(
            name: "IX_question_options_question_version_id",
            table: "question_options",
            column: "question_version_id");

        migrationBuilder.CreateIndex(
            name: "IX_question_versions_question_id",
            table: "question_versions",
            column: "question_id");

        migrationBuilder.CreateIndex(
            name: "IX_question_versions_survey_version_id",
            table: "question_versions",
            column: "survey_version_id");

        migrationBuilder.CreateIndex(
            name: "IX_survey_responses_survey_version_id",
            table: "survey_responses",
            column: "survey_version_id");

        migrationBuilder.CreateIndex(
            name: "IX_survey_responses_user_id",
            table: "survey_responses",
            column: "user_id");

        migrationBuilder.CreateIndex(
            name: "IX_survey_versions_survey_id",
            table: "survey_versions",
            column: "survey_id",
            unique: true,
            filter: "is_active = TRUE AND published_at IS NOT NULL");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "answer_booleans");

        migrationBuilder.DropTable(
            name: "answer_choices");

        migrationBuilder.DropTable(
            name: "answer_numbers");

        migrationBuilder.DropTable(
            name: "answer_texts");

        migrationBuilder.DropTable(
            name: "question_feature_maps");

        migrationBuilder.DropTable(
            name: "question_options");

        migrationBuilder.DropTable(
            name: "answers");

        migrationBuilder.DropTable(
            name: "features");

        migrationBuilder.DropTable(
            name: "question_versions");

        migrationBuilder.DropTable(
            name: "survey_responses");

        migrationBuilder.DropTable(
            name: "questions");

        migrationBuilder.DropTable(
            name: "survey_versions");

        migrationBuilder.DropTable(
            name: "surveys");
    }
}