import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_projects_blocks_case_feature_feature_key" AS ENUM('project-reel', 'process-timeline', 'technology-stack');
  CREATE TYPE "public"."enum_projects_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__projects_v_blocks_case_feature_feature_key" AS ENUM('project-reel', 'process-timeline', 'technology-stack');
  CREATE TYPE "public"."enum__projects_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_articles_blocks_article_callout_tone" AS ENUM('neutral', 'information', 'note');
  CREATE TYPE "public"."enum_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__articles_v_blocks_article_callout_tone" AS ENUM('neutral', 'information', 'note');
  CREATE TYPE "public"."enum__articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_pages_brand_overrides_usage_weights_role" AS ENUM('background', 'surface', 'text', 'mutedText', 'accent', 'interaction', 'success', 'danger');
  CREATE TYPE "public"."enum_pages_blocks_custom_feature_feature_key" AS ENUM('project-reel', 'research-index', 'contact-panel');
  CREATE TYPE "public"."enum_pages_brand_overrides_motion_easing" AS ENUM('linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out');
  CREATE TYPE "public"."enum_pages_brand_overrides_motion_reduced_motion" AS ENUM('reduce', 'disable');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_version_brand_overrides_usage_weights_role" AS ENUM('background', 'surface', 'text', 'mutedText', 'accent', 'interaction', 'success', 'danger');
  CREATE TYPE "public"."enum__pages_v_blocks_custom_feature_feature_key" AS ENUM('project-reel', 'research-index', 'contact-panel');
  CREATE TYPE "public"."enum__pages_v_version_brand_overrides_motion_easing" AS ENUM('linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out');
  CREATE TYPE "public"."enum__pages_v_version_brand_overrides_motion_reduced_motion" AS ENUM('reduce', 'disable');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_technologies_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__technologies_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_media_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__media_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_media_placements_placement_fit" AS ENUM('cover', 'contain');
  CREATE TYPE "public"."enum_media_placements_placement_frame" AS ENUM('auto', '16:9', '4:3', '1:1', '9:16');
  CREATE TYPE "public"."media_mobile_fit" AS ENUM('cover', 'contain');
  CREATE TYPE "public"."media_mobile_frame" AS ENUM('auto', '16:9', '4:3', '1:1', '9:16');
  CREATE TYPE "public"."media_tablet_fit" AS ENUM('cover', 'contain');
  CREATE TYPE "public"."media_tablet_frame" AS ENUM('auto', '16:9', '4:3', '1:1', '9:16');
  CREATE TYPE "public"."enum_media_placements_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__media_placements_v_version_placement_fit" AS ENUM('cover', 'contain');
  CREATE TYPE "public"."enum__media_placements_v_version_placement_frame" AS ENUM('auto', '16:9', '4:3', '1:1', '9:16');
  CREATE TYPE "public"."enum__media_placements_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_brand_profiles_colors_role" AS ENUM('background', 'surface', 'text', 'mutedText', 'accent', 'interaction', 'success', 'danger');
  CREATE TYPE "public"."enum_brand_profiles_usage_weights_role" AS ENUM('background', 'surface', 'text', 'mutedText', 'accent', 'interaction', 'success', 'danger');
  CREATE TYPE "public"."enum_brand_profiles_motion_easing" AS ENUM('linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out');
  CREATE TYPE "public"."enum_brand_profiles_motion_reduced_motion" AS ENUM('reduce', 'disable');
  CREATE TYPE "public"."enum_brand_profiles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__brand_profiles_v_version_colors_role" AS ENUM('background', 'surface', 'text', 'mutedText', 'accent', 'interaction', 'success', 'danger');
  CREATE TYPE "public"."enum__brand_profiles_v_version_usage_weights_role" AS ENUM('background', 'surface', 'text', 'mutedText', 'accent', 'interaction', 'success', 'danger');
  CREATE TYPE "public"."enum__brand_profiles_v_version_motion_easing" AS ENUM('linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out');
  CREATE TYPE "public"."enum__brand_profiles_v_version_motion_reduced_motion" AS ENUM('reduce', 'disable');
  CREATE TYPE "public"."enum__brand_profiles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_releases_quality_viewport" AS ENUM('desktop', 'mobile');
  CREATE TYPE "public"."enum_releases_quality_source" AS ENUM('lighthouse', 'manual');
  CREATE TYPE "public"."enum_assistance_proposals_capability" AS ENUM('suggestCopy', 'suggestPalette', 'suggestLayout', 'suggestCrop', 'suggestMotion');
  CREATE TYPE "public"."enum_assistance_proposals_status" AS ENUM('pending', 'accepted', 'rejected');
  CREATE TYPE "public"."enum_restore_plans_status" AS ENUM('ready', 'confirmed', 'conflict', 'executed');
  CREATE TYPE "public"."enum_publication_reviews_decision" AS ENUM('approved', 'rejected');
  CREATE TYPE "public"."enum_publication_preflights_status" AS ENUM('blocked', 'ready_with_warnings', 'ready');
  CREATE TYPE "public"."enum_figma_import_plans_status" AS ENUM('pending');
  CREATE TYPE "public"."enum_figma_import_plans_candidate_type" AS ENUM('FRAME', 'COMPONENT', 'SECTION');
  CREATE TYPE "public"."enum_figma_import_reviews_decision" AS ENUM('approved', 'rejected');
  CREATE TYPE "public"."enum_users_role" AS ENUM('owner');
  CREATE TYPE "public"."enum_audit_events_outcome" AS ENUM('success', 'denied', 'failure');
  CREATE TABLE "projects_blocks_case_section" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "content" jsonb,
    "block_name" varchar
  );

  CREATE TABLE "projects_blocks_case_media" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "asset_id" integer,
    "placement_id" integer,
    "alt" varchar,
    "caption" varchar,
    "block_name" varchar
  );

  CREATE TABLE "projects_blocks_case_gallery_items" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "asset_id" integer,
    "placement_id" integer,
    "alt" varchar,
    "caption" varchar
  );

  CREATE TABLE "projects_blocks_case_gallery" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "heading" varchar,
    "block_name" varchar
  );

  CREATE TABLE "projects_blocks_case_quote" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "quote" varchar,
    "attribution" varchar,
    "block_name" varchar
  );

  CREATE TABLE "projects_blocks_case_metrics_items" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "value" varchar,
    "label" varchar
  );

  CREATE TABLE "projects_blocks_case_metrics" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "projects_blocks_case_feature" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "feature_key" "enum_projects_blocks_case_feature_feature_key",
    "heading" varchar,
    "block_name" varchar
  );

  CREATE TABLE "projects_technologies" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "name" varchar,
    "icon_id" integer
  );

  CREATE TABLE "projects" (
    "id" serial PRIMARY KEY NOT NULL,
    "_order" varchar,
    "title" varchar,
    "slug" varchar,
    "summary" varchar,
    "hero_image_id" integer,
    "hero_placement_id" integer,
    "body" jsonb,
    "year" numeric,
    "seo_title" varchar,
    "seo_description" varchar,
    "seo_canonical_url" varchar,
    "seo_social_image_id" integer,
    "seo_no_index" boolean DEFAULT false,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp(3) with time zone,
    "_status" "enum_projects_status" DEFAULT 'draft'
  );

  CREATE TABLE "projects_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "technologies_id" integer
  );

  CREATE TABLE "_projects_v_blocks_case_section" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "content" jsonb,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_projects_v_blocks_case_media" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "asset_id" integer,
    "placement_id" integer,
    "alt" varchar,
    "caption" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_projects_v_blocks_case_gallery_items" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "asset_id" integer,
    "placement_id" integer,
    "alt" varchar,
    "caption" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_projects_v_blocks_case_gallery" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "heading" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_projects_v_blocks_case_quote" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "quote" varchar,
    "attribution" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_projects_v_blocks_case_metrics_items" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "value" varchar,
    "label" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_projects_v_blocks_case_metrics" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_projects_v_blocks_case_feature" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "feature_key" "enum__projects_v_blocks_case_feature_feature_key",
    "heading" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_projects_v_version_technologies" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar,
    "icon_id" integer,
    "_uuid" varchar
  );

  CREATE TABLE "_projects_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version__order" varchar,
    "version_title" varchar,
    "version_slug" varchar,
    "version_summary" varchar,
    "version_hero_image_id" integer,
    "version_hero_placement_id" integer,
    "version_body" jsonb,
    "version_year" numeric,
    "version_seo_title" varchar,
    "version_seo_description" varchar,
    "version_seo_canonical_url" varchar,
    "version_seo_social_image_id" integer,
    "version_seo_no_index" boolean DEFAULT false,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version_deleted_at" timestamp(3) with time zone,
    "version__status" "enum__projects_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  CREATE TABLE "_projects_v_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "technologies_id" integer
  );

  CREATE TABLE "articles_blocks_article_text" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "heading" varchar,
    "content" jsonb,
    "block_name" varchar
  );

  CREATE TABLE "articles_blocks_article_media" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "asset_id" integer,
    "placement_id" integer,
    "alt" varchar,
    "caption" varchar,
    "block_name" varchar
  );

  CREATE TABLE "articles_blocks_article_gallery_items" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "asset_id" integer,
    "placement_id" integer,
    "alt" varchar,
    "caption" varchar
  );

  CREATE TABLE "articles_blocks_article_gallery" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "articles_blocks_article_quote" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "quote" varchar,
    "attribution" varchar,
    "block_name" varchar
  );

  CREATE TABLE "articles_blocks_article_callout" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "tone" "enum_articles_blocks_article_callout_tone",
    "heading" varchar,
    "content" jsonb,
    "block_name" varchar
  );

  CREATE TABLE "articles_blocks_related_projects" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "heading" varchar,
    "block_name" varchar
  );

  CREATE TABLE "articles" (
    "id" serial PRIMARY KEY NOT NULL,
    "_order" varchar,
    "title" varchar,
    "slug" varchar,
    "excerpt" varchar,
    "cover_image_id" integer,
    "content" jsonb,
    "published_at" timestamp(3) with time zone,
    "seo_title" varchar,
    "seo_description" varchar,
    "seo_canonical_url" varchar,
    "seo_social_image_id" integer,
    "seo_no_index" boolean DEFAULT false,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp(3) with time zone,
    "_status" "enum_articles_status" DEFAULT 'draft'
  );

  CREATE TABLE "articles_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "projects_id" integer
  );

  CREATE TABLE "_articles_v_blocks_article_text" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "heading" varchar,
    "content" jsonb,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_articles_v_blocks_article_media" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "asset_id" integer,
    "placement_id" integer,
    "alt" varchar,
    "caption" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_articles_v_blocks_article_gallery_items" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "asset_id" integer,
    "placement_id" integer,
    "alt" varchar,
    "caption" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_articles_v_blocks_article_gallery" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_articles_v_blocks_article_quote" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "quote" varchar,
    "attribution" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_articles_v_blocks_article_callout" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "tone" "enum__articles_v_blocks_article_callout_tone",
    "heading" varchar,
    "content" jsonb,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_articles_v_blocks_related_projects" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "heading" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_articles_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version__order" varchar,
    "version_title" varchar,
    "version_slug" varchar,
    "version_excerpt" varchar,
    "version_cover_image_id" integer,
    "version_content" jsonb,
    "version_published_at" timestamp(3) with time zone,
    "version_seo_title" varchar,
    "version_seo_description" varchar,
    "version_seo_canonical_url" varchar,
    "version_seo_social_image_id" integer,
    "version_seo_no_index" boolean DEFAULT false,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version_deleted_at" timestamp(3) with time zone,
    "version__status" "enum__articles_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  CREATE TABLE "_articles_v_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "projects_id" integer
  );

  CREATE TABLE "pages_brand_overrides_usage_weights" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "role" "enum_pages_brand_overrides_usage_weights_role",
    "weight" numeric
  );

  CREATE TABLE "pages_blocks_hero" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "body" jsonb,
    "image_id" integer,
    "block_name" varchar
  );

  CREATE TABLE "pages_blocks_rich_text" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "content" jsonb,
    "block_name" varchar
  );

  CREATE TABLE "pages_blocks_project_grid" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "heading" varchar,
    "block_name" varchar
  );

  CREATE TABLE "pages_blocks_media" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "asset_id" integer,
    "placement_id" integer,
    "caption" varchar,
    "block_name" varchar
  );

  CREATE TABLE "pages_blocks_custom_feature" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "feature_key" "enum_pages_blocks_custom_feature_feature_key",
    "heading" varchar,
    "block_name" varchar
  );

  CREATE TABLE "pages" (
    "id" serial PRIMARY KEY NOT NULL,
    "_order" varchar,
    "restored_media_snapshot_id" integer,
    "title" varchar,
    "slug" varchar,
    "brand_profile_id" integer,
    "brand_overrides_accent" varchar,
    "brand_overrides_surface" varchar,
    "brand_overrides_motion_duration" numeric,
    "brand_overrides_motion_stagger" numeric,
    "brand_overrides_motion_travel" numeric,
    "brand_overrides_motion_easing" "enum_pages_brand_overrides_motion_easing",
    "brand_overrides_motion_reduced_motion" "enum_pages_brand_overrides_motion_reduced_motion",
    "seo_title" varchar,
    "seo_description" varchar,
    "seo_canonical_url" varchar,
    "seo_social_image_id" integer,
    "seo_no_index" boolean DEFAULT false,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp(3) with time zone,
    "_status" "enum_pages_status" DEFAULT 'draft'
  );

  CREATE TABLE "pages_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "projects_id" integer
  );

  CREATE TABLE "_pages_v_version_brand_overrides_usage_weights" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "role" "enum__pages_v_version_brand_overrides_usage_weights_role",
    "weight" numeric,
    "_uuid" varchar
  );

  CREATE TABLE "_pages_v_blocks_hero" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "body" jsonb,
    "image_id" integer,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_pages_v_blocks_rich_text" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "content" jsonb,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_pages_v_blocks_project_grid" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "heading" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_pages_v_blocks_media" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "asset_id" integer,
    "placement_id" integer,
    "caption" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_pages_v_blocks_custom_feature" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "feature_key" "enum__pages_v_blocks_custom_feature_feature_key",
    "heading" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_pages_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version__order" varchar,
    "version_restored_media_snapshot_id" integer,
    "version_title" varchar,
    "version_slug" varchar,
    "version_brand_profile_id" integer,
    "version_brand_overrides_accent" varchar,
    "version_brand_overrides_surface" varchar,
    "version_brand_overrides_motion_duration" numeric,
    "version_brand_overrides_motion_stagger" numeric,
    "version_brand_overrides_motion_travel" numeric,
    "version_brand_overrides_motion_easing" "enum__pages_v_version_brand_overrides_motion_easing",
    "version_brand_overrides_motion_reduced_motion" "enum__pages_v_version_brand_overrides_motion_reduced_motion",
    "version_seo_title" varchar,
    "version_seo_description" varchar,
    "version_seo_canonical_url" varchar,
    "version_seo_social_image_id" integer,
    "version_seo_no_index" boolean DEFAULT false,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version_deleted_at" timestamp(3) with time zone,
    "version__status" "enum__pages_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  CREATE TABLE "_pages_v_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "projects_id" integer
  );

  CREATE TABLE "technologies" (
    "id" serial PRIMARY KEY NOT NULL,
    "_order" varchar,
    "name" varchar,
    "slug" varchar,
    "icon_id" integer,
    "brand_color" varchar,
    "official_url" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp(3) with time zone,
    "_status" "enum_technologies_status" DEFAULT 'draft'
  );

  CREATE TABLE "_technologies_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version__order" varchar,
    "version_name" varchar,
    "version_slug" varchar,
    "version_icon_id" integer,
    "version_brand_color" varchar,
    "version_official_url" varchar,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version_deleted_at" timestamp(3) with time zone,
    "version__status" "enum__technologies_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  CREATE TABLE "media" (
    "id" serial PRIMARY KEY NOT NULL,
    "alt" varchar,
    "caption" varchar,
    "credit" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp(3) with time zone,
    "_status" "enum_media_status" DEFAULT 'draft',
    "url" varchar,
    "thumbnail_u_r_l" varchar,
    "filename" varchar,
    "mime_type" varchar,
    "filesize" numeric,
    "width" numeric,
    "height" numeric,
    "focal_x" numeric,
    "focal_y" numeric,
    "sizes_small_url" varchar,
    "sizes_small_width" numeric,
    "sizes_small_height" numeric,
    "sizes_small_mime_type" varchar,
    "sizes_small_filesize" numeric,
    "sizes_small_filename" varchar,
    "sizes_medium_url" varchar,
    "sizes_medium_width" numeric,
    "sizes_medium_height" numeric,
    "sizes_medium_mime_type" varchar,
    "sizes_medium_filesize" numeric,
    "sizes_medium_filename" varchar,
    "sizes_large_url" varchar,
    "sizes_large_width" numeric,
    "sizes_large_height" numeric,
    "sizes_large_mime_type" varchar,
    "sizes_large_filesize" numeric,
    "sizes_large_filename" varchar
  );

  CREATE TABLE "_media_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_alt" varchar,
    "version_caption" varchar,
    "version_credit" varchar,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version_deleted_at" timestamp(3) with time zone,
    "version__status" "enum__media_v_version_status" DEFAULT 'draft',
    "version_url" varchar,
    "version_thumbnail_u_r_l" varchar,
    "version_filename" varchar,
    "version_mime_type" varchar,
    "version_filesize" numeric,
    "version_width" numeric,
    "version_height" numeric,
    "version_focal_x" numeric,
    "version_focal_y" numeric,
    "version_sizes_small_url" varchar,
    "version_sizes_small_width" numeric,
    "version_sizes_small_height" numeric,
    "version_sizes_small_mime_type" varchar,
    "version_sizes_small_filesize" numeric,
    "version_sizes_small_filename" varchar,
    "version_sizes_medium_url" varchar,
    "version_sizes_medium_width" numeric,
    "version_sizes_medium_height" numeric,
    "version_sizes_medium_mime_type" varchar,
    "version_sizes_medium_filesize" numeric,
    "version_sizes_medium_filename" varchar,
    "version_sizes_large_url" varchar,
    "version_sizes_large_width" numeric,
    "version_sizes_large_height" numeric,
    "version_sizes_large_mime_type" varchar,
    "version_sizes_large_filesize" numeric,
    "version_sizes_large_filename" varchar,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  CREATE TABLE "media_placements" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar,
    "placement_asset_id" integer,
    "placement_focal_x" numeric DEFAULT 0.5,
    "placement_focal_y" numeric DEFAULT 0.5,
    "placement_zoom" numeric DEFAULT 1,
    "placement_fit" "enum_media_placements_placement_fit" DEFAULT 'cover',
    "placement_frame" "enum_media_placements_placement_frame" DEFAULT 'auto',
    "placement_overrides_mobile_focal_x" numeric,
    "placement_overrides_mobile_focal_y" numeric,
    "placement_overrides_mobile_zoom" numeric,
    "placement_overrides_mobile_fit" "media_mobile_fit",
    "placement_overrides_mobile_frame" "media_mobile_frame",
    "placement_overrides_tablet_focal_x" numeric,
    "placement_overrides_tablet_focal_y" numeric,
    "placement_overrides_tablet_zoom" numeric,
    "placement_overrides_tablet_fit" "media_tablet_fit",
    "placement_overrides_tablet_frame" "media_tablet_frame",
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp(3) with time zone,
    "_status" "enum_media_placements_status" DEFAULT 'draft'
  );

  CREATE TABLE "_media_placements_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_name" varchar,
    "version_placement_asset_id" integer,
    "version_placement_focal_x" numeric DEFAULT 0.5,
    "version_placement_focal_y" numeric DEFAULT 0.5,
    "version_placement_zoom" numeric DEFAULT 1,
    "version_placement_fit" "enum__media_placements_v_version_placement_fit" DEFAULT 'cover',
    "version_placement_frame" "enum__media_placements_v_version_placement_frame" DEFAULT 'auto',
    "version_placement_overrides_mobile_focal_x" numeric,
    "version_placement_overrides_mobile_focal_y" numeric,
    "version_placement_overrides_mobile_zoom" numeric,
    "version_placement_overrides_mobile_fit" "media_mobile_fit",
    "version_placement_overrides_mobile_frame" "media_mobile_frame",
    "version_placement_overrides_tablet_focal_x" numeric,
    "version_placement_overrides_tablet_focal_y" numeric,
    "version_placement_overrides_tablet_zoom" numeric,
    "version_placement_overrides_tablet_fit" "media_tablet_fit",
    "version_placement_overrides_tablet_frame" "media_tablet_frame",
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version_deleted_at" timestamp(3) with time zone,
    "version__status" "enum__media_placements_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  CREATE TABLE "brand_profiles_colors" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "role" "enum_brand_profiles_colors_role",
    "value" varchar
  );

  CREATE TABLE "brand_profiles_usage_weights" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "role" "enum_brand_profiles_usage_weights_role",
    "weight" numeric
  );

  CREATE TABLE "brand_profiles" (
    "id" serial PRIMARY KEY NOT NULL,
    "_order" varchar,
    "name" varchar,
    "slug" varchar,
    "typography_primary_family" varchar,
    "typography_secondary_family" varchar,
    "voice_notes" varchar,
    "motion_duration" numeric,
    "motion_stagger" numeric,
    "motion_travel" numeric,
    "motion_easing" "enum_brand_profiles_motion_easing",
    "motion_reduced_motion" "enum_brand_profiles_motion_reduced_motion",
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp(3) with time zone,
    "_status" "enum_brand_profiles_status" DEFAULT 'draft'
  );

  CREATE TABLE "brand_profiles_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "media_id" integer
  );

  CREATE TABLE "_brand_profiles_v_version_colors" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "role" "enum__brand_profiles_v_version_colors_role",
    "value" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_brand_profiles_v_version_usage_weights" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "role" "enum__brand_profiles_v_version_usage_weights_role",
    "weight" numeric,
    "_uuid" varchar
  );

  CREATE TABLE "_brand_profiles_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version__order" varchar,
    "version_name" varchar,
    "version_slug" varchar,
    "version_typography_primary_family" varchar,
    "version_typography_secondary_family" varchar,
    "version_voice_notes" varchar,
    "version_motion_duration" numeric,
    "version_motion_stagger" numeric,
    "version_motion_travel" numeric,
    "version_motion_easing" "enum__brand_profiles_v_version_motion_easing",
    "version_motion_reduced_motion" "enum__brand_profiles_v_version_motion_reduced_motion",
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version_deleted_at" timestamp(3) with time zone,
    "version__status" "enum__brand_profiles_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  CREATE TABLE "_brand_profiles_v_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "media_id" integer
  );

  CREATE TABLE "preview_snapshots" (
    "id" serial PRIMARY KEY NOT NULL,
    "schema_version" numeric NOT NULL,
    "source_collection" varchar NOT NULL,
    "source_document_id" varchar NOT NULL,
    "source_version_id" varchar NOT NULL,
    "manifest" jsonb NOT NULL,
    "manifest_hash" varchar NOT NULL,
    "created_by_id" integer NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "releases_quality" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "viewport" "enum_releases_quality_viewport" NOT NULL,
    "performance" numeric NOT NULL,
    "usability" numeric NOT NULL,
    "accessibility" numeric NOT NULL,
    "source" "enum_releases_quality_source" NOT NULL,
    "measured_at" timestamp(3) with time zone NOT NULL
  );

  CREATE TABLE "releases" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar NOT NULL,
    "change_summary" varchar NOT NULL,
    "git_commit" varchar NOT NULL,
    "preview_snapshot_id" integer NOT NULL,
    "draft_snapshot_id" integer NOT NULL,
    "created_by_id" integer NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "assistance_proposals" (
    "id" serial PRIMARY KEY NOT NULL,
    "target_page_id" integer NOT NULL,
    "source_snapshot_id" integer NOT NULL,
    "capability" "enum_assistance_proposals_capability" NOT NULL,
    "provider" varchar NOT NULL,
    "patch" jsonb NOT NULL,
    "status" "enum_assistance_proposals_status" DEFAULT 'pending' NOT NULL,
    "created_by_id" integer NOT NULL,
    "decision_note" varchar,
    "decided_by_id" integer,
    "decided_at" timestamp(3) with time zone,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "restore_plans" (
    "id" serial PRIMARY KEY NOT NULL,
    "release_id" integer NOT NULL,
    "target_page_id" integer NOT NULL,
    "target_snapshot_id" integer NOT NULL,
    "target_hash" varchar NOT NULL,
    "target_draft_snapshot_id" integer NOT NULL,
    "target_capsule_hash" varchar NOT NULL,
    "baseline_snapshot_id" integer NOT NULL,
    "baseline_hash" varchar NOT NULL,
    "status" "enum_restore_plans_status" NOT NULL,
    "created_by_id" integer NOT NULL,
    "confirmation_snapshot_id" integer,
    "conflict_hash" varchar,
    "confirmed_by_id" integer,
    "confirmed_at" timestamp(3) with time zone,
    "result_draft_snapshot_id" integer,
    "result_preview_snapshot_id" integer,
    "result_version_id" varchar,
    "executed_by_id" integer,
    "executed_at" timestamp(3) with time zone,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "draft_snapshots" (
    "id" serial PRIMARY KEY NOT NULL,
    "schema_version" numeric NOT NULL,
    "source_document_id" varchar NOT NULL,
    "source_version_id" varchar NOT NULL,
    "capsule" jsonb NOT NULL,
    "capsule_hash" varchar NOT NULL,
    "created_by_id" integer NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "publication_bundles" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar NOT NULL,
    "schema_version" numeric NOT NULL,
    "page_count" numeric NOT NULL,
    "bundle" jsonb NOT NULL,
    "bundle_hash" varchar NOT NULL,
    "created_by_id" integer NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "publication_reviews" (
    "id" serial PRIMARY KEY NOT NULL,
    "bundle_id" integer NOT NULL,
    "bundle_hash" varchar NOT NULL,
    "decision" "enum_publication_reviews_decision" NOT NULL,
    "decided_by_id" integer NOT NULL,
    "decided_at" timestamp(3) with time zone NOT NULL,
    "note" varchar,
    "schema_version" numeric NOT NULL,
    "review_hash" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "publication_artifacts" (
    "id" serial PRIMARY KEY NOT NULL,
    "review_id" integer NOT NULL,
    "review_hash" varchar NOT NULL,
    "bundle_id" integer NOT NULL,
    "bundle_hash" varchar NOT NULL,
    "page_count" numeric NOT NULL,
    "artifact" jsonb NOT NULL,
    "artifact_hash" varchar NOT NULL,
    "schema_version" numeric NOT NULL,
    "created_by_id" integer NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "publication_preflights" (
    "id" serial PRIMARY KEY NOT NULL,
    "artifact_id" integer NOT NULL,
    "artifact_hash" varchar NOT NULL,
    "export_hash" varchar NOT NULL,
    "status" "enum_publication_preflights_status" NOT NULL,
    "issue_count" numeric NOT NULL,
    "page_count" numeric NOT NULL,
    "checked_at" timestamp(3) with time zone NOT NULL,
    "report" jsonb NOT NULL,
    "preflight_hash" varchar NOT NULL,
    "schema_version" numeric NOT NULL,
    "created_by_id" integer NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "figma_import_plans" (
    "id" serial PRIMARY KEY NOT NULL,
    "schema_version" numeric NOT NULL,
    "status" "enum_figma_import_plans_status" NOT NULL,
    "source_file_key" varchar NOT NULL,
    "node_id" varchar NOT NULL,
    "candidate_name" varchar NOT NULL,
    "candidate_type" "enum_figma_import_plans_candidate_type" NOT NULL,
    "plan" jsonb NOT NULL,
    "plan_hash" varchar NOT NULL,
    "created_by_id" integer NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "figma_import_reviews" (
    "id" serial PRIMARY KEY NOT NULL,
    "plan_id" integer NOT NULL,
    "plan_hash" varchar NOT NULL,
    "decision" "enum_figma_import_reviews_decision" NOT NULL,
    "decided_by_id" integer NOT NULL,
    "decided_at" timestamp(3) with time zone NOT NULL,
    "note" varchar,
    "schema_version" numeric NOT NULL,
    "review_hash" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "figma_import_executions" (
    "id" serial PRIMARY KEY NOT NULL,
    "review_id" integer NOT NULL,
    "review_hash" varchar NOT NULL,
    "plan_id" integer NOT NULL,
    "plan_hash" varchar NOT NULL,
    "media_id" integer NOT NULL,
    "placement_id" integer NOT NULL,
    "content_hash" varchar NOT NULL,
    "mime_type" varchar NOT NULL,
    "size" numeric NOT NULL,
    "imported_by_id" integer NOT NULL,
    "imported_at" timestamp(3) with time zone NOT NULL,
    "schema_version" numeric NOT NULL,
    "execution_hash" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "users_sessions" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "created_at" timestamp(3) with time zone,
    "expires_at" timestamp(3) with time zone NOT NULL
  );

  CREATE TABLE "users" (
    "id" serial PRIMARY KEY NOT NULL,
    "role" "enum_users_role" DEFAULT 'owner' NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "email" varchar NOT NULL,
    "reset_password_token" varchar,
    "reset_password_expiration" timestamp(3) with time zone,
    "salt" varchar,
    "hash" varchar,
    "login_attempts" numeric DEFAULT 0,
    "lock_until" timestamp(3) with time zone
  );

  CREATE TABLE "audit_events" (
    "id" serial PRIMARY KEY NOT NULL,
    "actor_id" integer NOT NULL,
    "action" varchar NOT NULL,
    "subject_collection" varchar NOT NULL,
    "subject_id" varchar NOT NULL,
    "outcome" "enum_audit_events_outcome" NOT NULL,
    "metadata" jsonb NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "analytics_snapshots" (
    "id" serial PRIMARY KEY NOT NULL,
    "source" varchar NOT NULL,
    "period_from" timestamp(3) with time zone NOT NULL,
    "period_to" timestamp(3) with time zone NOT NULL,
    "captured_at" timestamp(3) with time zone NOT NULL,
    "route_count" numeric NOT NULL,
    "snapshot" jsonb NOT NULL,
    "snapshot_hash" varchar NOT NULL,
    "schema_version" numeric NOT NULL,
    "created_by_id" integer NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload_kv" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar NOT NULL,
    "data" jsonb NOT NULL
  );

  CREATE TABLE "payload_locked_documents" (
    "id" serial PRIMARY KEY NOT NULL,
    "global_slug" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload_locked_documents_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "projects_id" integer,
    "articles_id" integer,
    "pages_id" integer,
    "technologies_id" integer,
    "media_id" integer,
    "media_placements_id" integer,
    "brand_profiles_id" integer,
    "preview_snapshots_id" integer,
    "releases_id" integer,
    "assistance_proposals_id" integer,
    "restore_plans_id" integer,
    "draft_snapshots_id" integer,
    "publication_bundles_id" integer,
    "publication_reviews_id" integer,
    "publication_artifacts_id" integer,
    "publication_preflights_id" integer,
    "figma_import_plans_id" integer,
    "figma_import_reviews_id" integer,
    "figma_import_executions_id" integer,
    "users_id" integer,
    "audit_events_id" integer,
    "analytics_snapshots_id" integer
  );

  CREATE TABLE "payload_preferences" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "value" jsonb,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload_preferences_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "users_id" integer
  );

  CREATE TABLE "payload_migrations" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar,
    "batch" numeric,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "assistant_settings" (
    "id" serial PRIMARY KEY NOT NULL,
    "suggest_copy" boolean DEFAULT false,
    "suggest_palette" boolean DEFAULT false,
    "suggest_layout" boolean DEFAULT false,
    "suggest_crop" boolean DEFAULT false,
    "suggest_motion" boolean DEFAULT false,
    "updated_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone
  );

  CREATE TABLE "_assistant_settings_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "version_suggest_copy" boolean DEFAULT false,
    "version_suggest_palette" boolean DEFAULT false,
    "version_suggest_layout" boolean DEFAULT false,
    "version_suggest_crop" boolean DEFAULT false,
    "version_suggest_motion" boolean DEFAULT false,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "projects_blocks_case_section" ADD CONSTRAINT "projects_blocks_case_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_case_media" ADD CONSTRAINT "projects_blocks_case_media_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_blocks_case_media" ADD CONSTRAINT "projects_blocks_case_media_placement_id_media_placements_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."media_placements"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_blocks_case_media" ADD CONSTRAINT "projects_blocks_case_media_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_case_gallery_items" ADD CONSTRAINT "projects_blocks_case_gallery_items_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_blocks_case_gallery_items" ADD CONSTRAINT "projects_blocks_case_gallery_items_placement_id_media_placements_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."media_placements"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_blocks_case_gallery_items" ADD CONSTRAINT "projects_blocks_case_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_blocks_case_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_case_gallery" ADD CONSTRAINT "projects_blocks_case_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_case_quote" ADD CONSTRAINT "projects_blocks_case_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_case_metrics_items" ADD CONSTRAINT "projects_blocks_case_metrics_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_blocks_case_metrics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_case_metrics" ADD CONSTRAINT "projects_blocks_case_metrics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_case_feature" ADD CONSTRAINT "projects_blocks_case_feature_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_technologies" ADD CONSTRAINT "projects_technologies_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_technologies" ADD CONSTRAINT "projects_technologies_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_hero_placement_id_media_placements_id_fk" FOREIGN KEY ("hero_placement_id") REFERENCES "public"."media_placements"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_seo_social_image_id_media_id_fk" FOREIGN KEY ("seo_social_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_technologies_fk" FOREIGN KEY ("technologies_id") REFERENCES "public"."technologies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_blocks_case_section" ADD CONSTRAINT "_projects_v_blocks_case_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_blocks_case_media" ADD CONSTRAINT "_projects_v_blocks_case_media_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v_blocks_case_media" ADD CONSTRAINT "_projects_v_blocks_case_media_placement_id_media_placements_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."media_placements"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v_blocks_case_media" ADD CONSTRAINT "_projects_v_blocks_case_media_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_blocks_case_gallery_items" ADD CONSTRAINT "_projects_v_blocks_case_gallery_items_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v_blocks_case_gallery_items" ADD CONSTRAINT "_projects_v_blocks_case_gallery_items_placement_id_media_placements_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."media_placements"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v_blocks_case_gallery_items" ADD CONSTRAINT "_projects_v_blocks_case_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v_blocks_case_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_blocks_case_gallery" ADD CONSTRAINT "_projects_v_blocks_case_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_blocks_case_quote" ADD CONSTRAINT "_projects_v_blocks_case_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_blocks_case_metrics_items" ADD CONSTRAINT "_projects_v_blocks_case_metrics_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v_blocks_case_metrics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_blocks_case_metrics" ADD CONSTRAINT "_projects_v_blocks_case_metrics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_blocks_case_feature" ADD CONSTRAINT "_projects_v_blocks_case_feature_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_technologies" ADD CONSTRAINT "_projects_v_version_technologies_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v_version_technologies" ADD CONSTRAINT "_projects_v_version_technologies_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_parent_id_projects_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_hero_placement_id_media_placements_id_fk" FOREIGN KEY ("version_hero_placement_id") REFERENCES "public"."media_placements"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_seo_social_image_id_media_id_fk" FOREIGN KEY ("version_seo_social_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_technologies_fk" FOREIGN KEY ("technologies_id") REFERENCES "public"."technologies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_article_text" ADD CONSTRAINT "articles_blocks_article_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_article_media" ADD CONSTRAINT "articles_blocks_article_media_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_blocks_article_media" ADD CONSTRAINT "articles_blocks_article_media_placement_id_media_placements_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."media_placements"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_blocks_article_media" ADD CONSTRAINT "articles_blocks_article_media_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_article_gallery_items" ADD CONSTRAINT "articles_blocks_article_gallery_items_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_blocks_article_gallery_items" ADD CONSTRAINT "articles_blocks_article_gallery_items_placement_id_media_placements_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."media_placements"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_blocks_article_gallery_items" ADD CONSTRAINT "articles_blocks_article_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles_blocks_article_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_article_gallery" ADD CONSTRAINT "articles_blocks_article_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_article_quote" ADD CONSTRAINT "articles_blocks_article_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_article_callout" ADD CONSTRAINT "articles_blocks_article_callout_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_related_projects" ADD CONSTRAINT "articles_blocks_related_projects_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_seo_social_image_id_media_id_fk" FOREIGN KEY ("seo_social_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_blocks_article_text" ADD CONSTRAINT "_articles_v_blocks_article_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_blocks_article_media" ADD CONSTRAINT "_articles_v_blocks_article_media_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v_blocks_article_media" ADD CONSTRAINT "_articles_v_blocks_article_media_placement_id_media_placements_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."media_placements"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v_blocks_article_media" ADD CONSTRAINT "_articles_v_blocks_article_media_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_blocks_article_gallery_items" ADD CONSTRAINT "_articles_v_blocks_article_gallery_items_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v_blocks_article_gallery_items" ADD CONSTRAINT "_articles_v_blocks_article_gallery_items_placement_id_media_placements_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."media_placements"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v_blocks_article_gallery_items" ADD CONSTRAINT "_articles_v_blocks_article_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v_blocks_article_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_blocks_article_gallery" ADD CONSTRAINT "_articles_v_blocks_article_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_blocks_article_quote" ADD CONSTRAINT "_articles_v_blocks_article_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_blocks_article_callout" ADD CONSTRAINT "_articles_v_blocks_article_callout_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_blocks_related_projects" ADD CONSTRAINT "_articles_v_blocks_related_projects_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_parent_id_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_seo_social_image_id_media_id_fk" FOREIGN KEY ("version_seo_social_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_brand_overrides_usage_weights" ADD CONSTRAINT "pages_brand_overrides_usage_weights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_rich_text" ADD CONSTRAINT "pages_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_project_grid" ADD CONSTRAINT "pages_blocks_project_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_media" ADD CONSTRAINT "pages_blocks_media_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_media" ADD CONSTRAINT "pages_blocks_media_placement_id_media_placements_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."media_placements"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_media" ADD CONSTRAINT "pages_blocks_media_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_custom_feature" ADD CONSTRAINT "pages_blocks_custom_feature_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_restored_media_snapshot_id_preview_snapshots_id_fk" FOREIGN KEY ("restored_media_snapshot_id") REFERENCES "public"."preview_snapshots"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_brand_profile_id_brand_profiles_id_fk" FOREIGN KEY ("brand_profile_id") REFERENCES "public"."brand_profiles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_seo_social_image_id_media_id_fk" FOREIGN KEY ("seo_social_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_version_brand_overrides_usage_weights" ADD CONSTRAINT "_pages_v_version_brand_overrides_usage_weights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rich_text" ADD CONSTRAINT "_pages_v_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_project_grid" ADD CONSTRAINT "_pages_v_blocks_project_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_media" ADD CONSTRAINT "_pages_v_blocks_media_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_media" ADD CONSTRAINT "_pages_v_blocks_media_placement_id_media_placements_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."media_placements"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_media" ADD CONSTRAINT "_pages_v_blocks_media_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_custom_feature" ADD CONSTRAINT "_pages_v_blocks_custom_feature_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_restored_media_snapshot_id_preview_snapshots_id_fk" FOREIGN KEY ("version_restored_media_snapshot_id") REFERENCES "public"."preview_snapshots"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_brand_profile_id_brand_profiles_id_fk" FOREIGN KEY ("version_brand_profile_id") REFERENCES "public"."brand_profiles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_seo_social_image_id_media_id_fk" FOREIGN KEY ("version_seo_social_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "technologies" ADD CONSTRAINT "technologies_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_technologies_v" ADD CONSTRAINT "_technologies_v_parent_id_technologies_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."technologies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_technologies_v" ADD CONSTRAINT "_technologies_v_version_icon_id_media_id_fk" FOREIGN KEY ("version_icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_media_v" ADD CONSTRAINT "_media_v_parent_id_media_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "media_placements" ADD CONSTRAINT "media_placements_placement_asset_id_media_id_fk" FOREIGN KEY ("placement_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_media_placements_v" ADD CONSTRAINT "_media_placements_v_parent_id_media_placements_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."media_placements"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_media_placements_v" ADD CONSTRAINT "_media_placements_v_version_placement_asset_id_media_id_fk" FOREIGN KEY ("version_placement_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "brand_profiles_colors" ADD CONSTRAINT "brand_profiles_colors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."brand_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "brand_profiles_usage_weights" ADD CONSTRAINT "brand_profiles_usage_weights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."brand_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "brand_profiles_rels" ADD CONSTRAINT "brand_profiles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."brand_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "brand_profiles_rels" ADD CONSTRAINT "brand_profiles_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_brand_profiles_v_version_colors" ADD CONSTRAINT "_brand_profiles_v_version_colors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_brand_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_brand_profiles_v_version_usage_weights" ADD CONSTRAINT "_brand_profiles_v_version_usage_weights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_brand_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_brand_profiles_v" ADD CONSTRAINT "_brand_profiles_v_parent_id_brand_profiles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."brand_profiles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_brand_profiles_v_rels" ADD CONSTRAINT "_brand_profiles_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_brand_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_brand_profiles_v_rels" ADD CONSTRAINT "_brand_profiles_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "preview_snapshots" ADD CONSTRAINT "preview_snapshots_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "releases_quality" ADD CONSTRAINT "releases_quality_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."releases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "releases" ADD CONSTRAINT "releases_preview_snapshot_id_preview_snapshots_id_fk" FOREIGN KEY ("preview_snapshot_id") REFERENCES "public"."preview_snapshots"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "releases" ADD CONSTRAINT "releases_draft_snapshot_id_draft_snapshots_id_fk" FOREIGN KEY ("draft_snapshot_id") REFERENCES "public"."draft_snapshots"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "releases" ADD CONSTRAINT "releases_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "assistance_proposals" ADD CONSTRAINT "assistance_proposals_target_page_id_pages_id_fk" FOREIGN KEY ("target_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "assistance_proposals" ADD CONSTRAINT "assistance_proposals_source_snapshot_id_preview_snapshots_id_fk" FOREIGN KEY ("source_snapshot_id") REFERENCES "public"."preview_snapshots"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "assistance_proposals" ADD CONSTRAINT "assistance_proposals_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "assistance_proposals" ADD CONSTRAINT "assistance_proposals_decided_by_id_users_id_fk" FOREIGN KEY ("decided_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "restore_plans" ADD CONSTRAINT "restore_plans_release_id_releases_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "restore_plans" ADD CONSTRAINT "restore_plans_target_page_id_pages_id_fk" FOREIGN KEY ("target_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "restore_plans" ADD CONSTRAINT "restore_plans_target_snapshot_id_preview_snapshots_id_fk" FOREIGN KEY ("target_snapshot_id") REFERENCES "public"."preview_snapshots"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "restore_plans" ADD CONSTRAINT "restore_plans_target_draft_snapshot_id_draft_snapshots_id_fk" FOREIGN KEY ("target_draft_snapshot_id") REFERENCES "public"."draft_snapshots"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "restore_plans" ADD CONSTRAINT "restore_plans_baseline_snapshot_id_preview_snapshots_id_fk" FOREIGN KEY ("baseline_snapshot_id") REFERENCES "public"."preview_snapshots"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "restore_plans" ADD CONSTRAINT "restore_plans_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "restore_plans" ADD CONSTRAINT "restore_plans_confirmation_snapshot_id_preview_snapshots_id_fk" FOREIGN KEY ("confirmation_snapshot_id") REFERENCES "public"."preview_snapshots"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "restore_plans" ADD CONSTRAINT "restore_plans_confirmed_by_id_users_id_fk" FOREIGN KEY ("confirmed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "restore_plans" ADD CONSTRAINT "restore_plans_result_draft_snapshot_id_draft_snapshots_id_fk" FOREIGN KEY ("result_draft_snapshot_id") REFERENCES "public"."draft_snapshots"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "restore_plans" ADD CONSTRAINT "restore_plans_result_preview_snapshot_id_preview_snapshots_id_fk" FOREIGN KEY ("result_preview_snapshot_id") REFERENCES "public"."preview_snapshots"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "restore_plans" ADD CONSTRAINT "restore_plans_executed_by_id_users_id_fk" FOREIGN KEY ("executed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "draft_snapshots" ADD CONSTRAINT "draft_snapshots_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "publication_bundles" ADD CONSTRAINT "publication_bundles_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "publication_reviews" ADD CONSTRAINT "publication_reviews_bundle_id_publication_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."publication_bundles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "publication_reviews" ADD CONSTRAINT "publication_reviews_decided_by_id_users_id_fk" FOREIGN KEY ("decided_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "publication_artifacts" ADD CONSTRAINT "publication_artifacts_review_id_publication_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."publication_reviews"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "publication_artifacts" ADD CONSTRAINT "publication_artifacts_bundle_id_publication_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."publication_bundles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "publication_artifacts" ADD CONSTRAINT "publication_artifacts_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "publication_preflights" ADD CONSTRAINT "publication_preflights_artifact_id_publication_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."publication_artifacts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "publication_preflights" ADD CONSTRAINT "publication_preflights_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "figma_import_plans" ADD CONSTRAINT "figma_import_plans_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "figma_import_reviews" ADD CONSTRAINT "figma_import_reviews_plan_id_figma_import_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."figma_import_plans"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "figma_import_reviews" ADD CONSTRAINT "figma_import_reviews_decided_by_id_users_id_fk" FOREIGN KEY ("decided_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "figma_import_executions" ADD CONSTRAINT "figma_import_executions_review_id_figma_import_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."figma_import_reviews"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "figma_import_executions" ADD CONSTRAINT "figma_import_executions_plan_id_figma_import_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."figma_import_plans"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "figma_import_executions" ADD CONSTRAINT "figma_import_executions_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "figma_import_executions" ADD CONSTRAINT "figma_import_executions_placement_id_media_placements_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."media_placements"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "figma_import_executions" ADD CONSTRAINT "figma_import_executions_imported_by_id_users_id_fk" FOREIGN KEY ("imported_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "analytics_snapshots" ADD CONSTRAINT "analytics_snapshots_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_technologies_fk" FOREIGN KEY ("technologies_id") REFERENCES "public"."technologies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_placements_fk" FOREIGN KEY ("media_placements_id") REFERENCES "public"."media_placements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brand_profiles_fk" FOREIGN KEY ("brand_profiles_id") REFERENCES "public"."brand_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_preview_snapshots_fk" FOREIGN KEY ("preview_snapshots_id") REFERENCES "public"."preview_snapshots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_releases_fk" FOREIGN KEY ("releases_id") REFERENCES "public"."releases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_assistance_proposals_fk" FOREIGN KEY ("assistance_proposals_id") REFERENCES "public"."assistance_proposals"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_restore_plans_fk" FOREIGN KEY ("restore_plans_id") REFERENCES "public"."restore_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_draft_snapshots_fk" FOREIGN KEY ("draft_snapshots_id") REFERENCES "public"."draft_snapshots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_publication_bundles_fk" FOREIGN KEY ("publication_bundles_id") REFERENCES "public"."publication_bundles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_publication_reviews_fk" FOREIGN KEY ("publication_reviews_id") REFERENCES "public"."publication_reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_publication_artifacts_fk" FOREIGN KEY ("publication_artifacts_id") REFERENCES "public"."publication_artifacts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_publication_preflights_fk" FOREIGN KEY ("publication_preflights_id") REFERENCES "public"."publication_preflights"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_figma_import_plans_fk" FOREIGN KEY ("figma_import_plans_id") REFERENCES "public"."figma_import_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_figma_import_reviews_fk" FOREIGN KEY ("figma_import_reviews_id") REFERENCES "public"."figma_import_reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_figma_import_executions_fk" FOREIGN KEY ("figma_import_executions_id") REFERENCES "public"."figma_import_executions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_events_fk" FOREIGN KEY ("audit_events_id") REFERENCES "public"."audit_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_analytics_snapshots_fk" FOREIGN KEY ("analytics_snapshots_id") REFERENCES "public"."analytics_snapshots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "projects_blocks_case_section_order_idx" ON "projects_blocks_case_section" USING btree ("_order");
  CREATE INDEX "projects_blocks_case_section_parent_id_idx" ON "projects_blocks_case_section" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_case_section_path_idx" ON "projects_blocks_case_section" USING btree ("_path");
  CREATE INDEX "projects_blocks_case_media_order_idx" ON "projects_blocks_case_media" USING btree ("_order");
  CREATE INDEX "projects_blocks_case_media_parent_id_idx" ON "projects_blocks_case_media" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_case_media_path_idx" ON "projects_blocks_case_media" USING btree ("_path");
  CREATE INDEX "projects_blocks_case_media_asset_idx" ON "projects_blocks_case_media" USING btree ("asset_id");
  CREATE INDEX "projects_blocks_case_media_placement_idx" ON "projects_blocks_case_media" USING btree ("placement_id");
  CREATE INDEX "projects_blocks_case_gallery_items_order_idx" ON "projects_blocks_case_gallery_items" USING btree ("_order");
  CREATE INDEX "projects_blocks_case_gallery_items_parent_id_idx" ON "projects_blocks_case_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_case_gallery_items_asset_idx" ON "projects_blocks_case_gallery_items" USING btree ("asset_id");
  CREATE INDEX "projects_blocks_case_gallery_items_placement_idx" ON "projects_blocks_case_gallery_items" USING btree ("placement_id");
  CREATE INDEX "projects_blocks_case_gallery_order_idx" ON "projects_blocks_case_gallery" USING btree ("_order");
  CREATE INDEX "projects_blocks_case_gallery_parent_id_idx" ON "projects_blocks_case_gallery" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_case_gallery_path_idx" ON "projects_blocks_case_gallery" USING btree ("_path");
  CREATE INDEX "projects_blocks_case_quote_order_idx" ON "projects_blocks_case_quote" USING btree ("_order");
  CREATE INDEX "projects_blocks_case_quote_parent_id_idx" ON "projects_blocks_case_quote" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_case_quote_path_idx" ON "projects_blocks_case_quote" USING btree ("_path");
  CREATE INDEX "projects_blocks_case_metrics_items_order_idx" ON "projects_blocks_case_metrics_items" USING btree ("_order");
  CREATE INDEX "projects_blocks_case_metrics_items_parent_id_idx" ON "projects_blocks_case_metrics_items" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_case_metrics_order_idx" ON "projects_blocks_case_metrics" USING btree ("_order");
  CREATE INDEX "projects_blocks_case_metrics_parent_id_idx" ON "projects_blocks_case_metrics" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_case_metrics_path_idx" ON "projects_blocks_case_metrics" USING btree ("_path");
  CREATE INDEX "projects_blocks_case_feature_order_idx" ON "projects_blocks_case_feature" USING btree ("_order");
  CREATE INDEX "projects_blocks_case_feature_parent_id_idx" ON "projects_blocks_case_feature" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_case_feature_path_idx" ON "projects_blocks_case_feature" USING btree ("_path");
  CREATE INDEX "projects_technologies_order_idx" ON "projects_technologies" USING btree ("_order");
  CREATE INDEX "projects_technologies_parent_id_idx" ON "projects_technologies" USING btree ("_parent_id");
  CREATE INDEX "projects_technologies_icon_idx" ON "projects_technologies" USING btree ("icon_id");
  CREATE INDEX "projects__order_idx" ON "projects" USING btree ("_order");
  CREATE UNIQUE INDEX "projects_slug_idx" ON "projects" USING btree ("slug");
  CREATE INDEX "projects_hero_image_idx" ON "projects" USING btree ("hero_image_id");
  CREATE INDEX "projects_hero_placement_idx" ON "projects" USING btree ("hero_placement_id");
  CREATE INDEX "projects_seo_seo_social_image_idx" ON "projects" USING btree ("seo_social_image_id");
  CREATE INDEX "projects_updated_at_idx" ON "projects" USING btree ("updated_at");
  CREATE INDEX "projects_created_at_idx" ON "projects" USING btree ("created_at");
  CREATE INDEX "projects_deleted_at_idx" ON "projects" USING btree ("deleted_at");
  CREATE INDEX "projects__status_idx" ON "projects" USING btree ("_status");
  CREATE INDEX "projects_rels_order_idx" ON "projects_rels" USING btree ("order");
  CREATE INDEX "projects_rels_parent_idx" ON "projects_rels" USING btree ("parent_id");
  CREATE INDEX "projects_rels_path_idx" ON "projects_rels" USING btree ("path");
  CREATE INDEX "projects_rels_technologies_id_idx" ON "projects_rels" USING btree ("technologies_id");
  CREATE INDEX "_projects_v_blocks_case_section_order_idx" ON "_projects_v_blocks_case_section" USING btree ("_order");
  CREATE INDEX "_projects_v_blocks_case_section_parent_id_idx" ON "_projects_v_blocks_case_section" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_blocks_case_section_path_idx" ON "_projects_v_blocks_case_section" USING btree ("_path");
  CREATE INDEX "_projects_v_blocks_case_media_order_idx" ON "_projects_v_blocks_case_media" USING btree ("_order");
  CREATE INDEX "_projects_v_blocks_case_media_parent_id_idx" ON "_projects_v_blocks_case_media" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_blocks_case_media_path_idx" ON "_projects_v_blocks_case_media" USING btree ("_path");
  CREATE INDEX "_projects_v_blocks_case_media_asset_idx" ON "_projects_v_blocks_case_media" USING btree ("asset_id");
  CREATE INDEX "_projects_v_blocks_case_media_placement_idx" ON "_projects_v_blocks_case_media" USING btree ("placement_id");
  CREATE INDEX "_projects_v_blocks_case_gallery_items_order_idx" ON "_projects_v_blocks_case_gallery_items" USING btree ("_order");
  CREATE INDEX "_projects_v_blocks_case_gallery_items_parent_id_idx" ON "_projects_v_blocks_case_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_blocks_case_gallery_items_asset_idx" ON "_projects_v_blocks_case_gallery_items" USING btree ("asset_id");
  CREATE INDEX "_projects_v_blocks_case_gallery_items_placement_idx" ON "_projects_v_blocks_case_gallery_items" USING btree ("placement_id");
  CREATE INDEX "_projects_v_blocks_case_gallery_order_idx" ON "_projects_v_blocks_case_gallery" USING btree ("_order");
  CREATE INDEX "_projects_v_blocks_case_gallery_parent_id_idx" ON "_projects_v_blocks_case_gallery" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_blocks_case_gallery_path_idx" ON "_projects_v_blocks_case_gallery" USING btree ("_path");
  CREATE INDEX "_projects_v_blocks_case_quote_order_idx" ON "_projects_v_blocks_case_quote" USING btree ("_order");
  CREATE INDEX "_projects_v_blocks_case_quote_parent_id_idx" ON "_projects_v_blocks_case_quote" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_blocks_case_quote_path_idx" ON "_projects_v_blocks_case_quote" USING btree ("_path");
  CREATE INDEX "_projects_v_blocks_case_metrics_items_order_idx" ON "_projects_v_blocks_case_metrics_items" USING btree ("_order");
  CREATE INDEX "_projects_v_blocks_case_metrics_items_parent_id_idx" ON "_projects_v_blocks_case_metrics_items" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_blocks_case_metrics_order_idx" ON "_projects_v_blocks_case_metrics" USING btree ("_order");
  CREATE INDEX "_projects_v_blocks_case_metrics_parent_id_idx" ON "_projects_v_blocks_case_metrics" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_blocks_case_metrics_path_idx" ON "_projects_v_blocks_case_metrics" USING btree ("_path");
  CREATE INDEX "_projects_v_blocks_case_feature_order_idx" ON "_projects_v_blocks_case_feature" USING btree ("_order");
  CREATE INDEX "_projects_v_blocks_case_feature_parent_id_idx" ON "_projects_v_blocks_case_feature" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_blocks_case_feature_path_idx" ON "_projects_v_blocks_case_feature" USING btree ("_path");
  CREATE INDEX "_projects_v_version_technologies_order_idx" ON "_projects_v_version_technologies" USING btree ("_order");
  CREATE INDEX "_projects_v_version_technologies_parent_id_idx" ON "_projects_v_version_technologies" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_technologies_icon_idx" ON "_projects_v_version_technologies" USING btree ("icon_id");
  CREATE INDEX "_projects_v_parent_idx" ON "_projects_v" USING btree ("parent_id");
  CREATE INDEX "_projects_v_version_version__order_idx" ON "_projects_v" USING btree ("version__order");
  CREATE INDEX "_projects_v_version_version_slug_idx" ON "_projects_v" USING btree ("version_slug");
  CREATE INDEX "_projects_v_version_version_hero_image_idx" ON "_projects_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_projects_v_version_version_hero_placement_idx" ON "_projects_v" USING btree ("version_hero_placement_id");
  CREATE INDEX "_projects_v_version_seo_version_seo_social_image_idx" ON "_projects_v" USING btree ("version_seo_social_image_id");
  CREATE INDEX "_projects_v_version_version_updated_at_idx" ON "_projects_v" USING btree ("version_updated_at");
  CREATE INDEX "_projects_v_version_version_created_at_idx" ON "_projects_v" USING btree ("version_created_at");
  CREATE INDEX "_projects_v_version_version_deleted_at_idx" ON "_projects_v" USING btree ("version_deleted_at");
  CREATE INDEX "_projects_v_version_version__status_idx" ON "_projects_v" USING btree ("version__status");
  CREATE INDEX "_projects_v_created_at_idx" ON "_projects_v" USING btree ("created_at");
  CREATE INDEX "_projects_v_updated_at_idx" ON "_projects_v" USING btree ("updated_at");
  CREATE INDEX "_projects_v_latest_idx" ON "_projects_v" USING btree ("latest");
  CREATE INDEX "_projects_v_rels_order_idx" ON "_projects_v_rels" USING btree ("order");
  CREATE INDEX "_projects_v_rels_parent_idx" ON "_projects_v_rels" USING btree ("parent_id");
  CREATE INDEX "_projects_v_rels_path_idx" ON "_projects_v_rels" USING btree ("path");
  CREATE INDEX "_projects_v_rels_technologies_id_idx" ON "_projects_v_rels" USING btree ("technologies_id");
  CREATE INDEX "articles_blocks_article_text_order_idx" ON "articles_blocks_article_text" USING btree ("_order");
  CREATE INDEX "articles_blocks_article_text_parent_id_idx" ON "articles_blocks_article_text" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_article_text_path_idx" ON "articles_blocks_article_text" USING btree ("_path");
  CREATE INDEX "articles_blocks_article_media_order_idx" ON "articles_blocks_article_media" USING btree ("_order");
  CREATE INDEX "articles_blocks_article_media_parent_id_idx" ON "articles_blocks_article_media" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_article_media_path_idx" ON "articles_blocks_article_media" USING btree ("_path");
  CREATE INDEX "articles_blocks_article_media_asset_idx" ON "articles_blocks_article_media" USING btree ("asset_id");
  CREATE INDEX "articles_blocks_article_media_placement_idx" ON "articles_blocks_article_media" USING btree ("placement_id");
  CREATE INDEX "articles_blocks_article_gallery_items_order_idx" ON "articles_blocks_article_gallery_items" USING btree ("_order");
  CREATE INDEX "articles_blocks_article_gallery_items_parent_id_idx" ON "articles_blocks_article_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_article_gallery_items_asset_idx" ON "articles_blocks_article_gallery_items" USING btree ("asset_id");
  CREATE INDEX "articles_blocks_article_gallery_items_placement_idx" ON "articles_blocks_article_gallery_items" USING btree ("placement_id");
  CREATE INDEX "articles_blocks_article_gallery_order_idx" ON "articles_blocks_article_gallery" USING btree ("_order");
  CREATE INDEX "articles_blocks_article_gallery_parent_id_idx" ON "articles_blocks_article_gallery" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_article_gallery_path_idx" ON "articles_blocks_article_gallery" USING btree ("_path");
  CREATE INDEX "articles_blocks_article_quote_order_idx" ON "articles_blocks_article_quote" USING btree ("_order");
  CREATE INDEX "articles_blocks_article_quote_parent_id_idx" ON "articles_blocks_article_quote" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_article_quote_path_idx" ON "articles_blocks_article_quote" USING btree ("_path");
  CREATE INDEX "articles_blocks_article_callout_order_idx" ON "articles_blocks_article_callout" USING btree ("_order");
  CREATE INDEX "articles_blocks_article_callout_parent_id_idx" ON "articles_blocks_article_callout" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_article_callout_path_idx" ON "articles_blocks_article_callout" USING btree ("_path");
  CREATE INDEX "articles_blocks_related_projects_order_idx" ON "articles_blocks_related_projects" USING btree ("_order");
  CREATE INDEX "articles_blocks_related_projects_parent_id_idx" ON "articles_blocks_related_projects" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_related_projects_path_idx" ON "articles_blocks_related_projects" USING btree ("_path");
  CREATE INDEX "articles__order_idx" ON "articles" USING btree ("_order");
  CREATE UNIQUE INDEX "articles_slug_idx" ON "articles" USING btree ("slug");
  CREATE INDEX "articles_cover_image_idx" ON "articles" USING btree ("cover_image_id");
  CREATE INDEX "articles_seo_seo_social_image_idx" ON "articles" USING btree ("seo_social_image_id");
  CREATE INDEX "articles_updated_at_idx" ON "articles" USING btree ("updated_at");
  CREATE INDEX "articles_created_at_idx" ON "articles" USING btree ("created_at");
  CREATE INDEX "articles_deleted_at_idx" ON "articles" USING btree ("deleted_at");
  CREATE INDEX "articles__status_idx" ON "articles" USING btree ("_status");
  CREATE INDEX "articles_rels_order_idx" ON "articles_rels" USING btree ("order");
  CREATE INDEX "articles_rels_parent_idx" ON "articles_rels" USING btree ("parent_id");
  CREATE INDEX "articles_rels_path_idx" ON "articles_rels" USING btree ("path");
  CREATE INDEX "articles_rels_projects_id_idx" ON "articles_rels" USING btree ("projects_id");
  CREATE INDEX "_articles_v_blocks_article_text_order_idx" ON "_articles_v_blocks_article_text" USING btree ("_order");
  CREATE INDEX "_articles_v_blocks_article_text_parent_id_idx" ON "_articles_v_blocks_article_text" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_blocks_article_text_path_idx" ON "_articles_v_blocks_article_text" USING btree ("_path");
  CREATE INDEX "_articles_v_blocks_article_media_order_idx" ON "_articles_v_blocks_article_media" USING btree ("_order");
  CREATE INDEX "_articles_v_blocks_article_media_parent_id_idx" ON "_articles_v_blocks_article_media" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_blocks_article_media_path_idx" ON "_articles_v_blocks_article_media" USING btree ("_path");
  CREATE INDEX "_articles_v_blocks_article_media_asset_idx" ON "_articles_v_blocks_article_media" USING btree ("asset_id");
  CREATE INDEX "_articles_v_blocks_article_media_placement_idx" ON "_articles_v_blocks_article_media" USING btree ("placement_id");
  CREATE INDEX "_articles_v_blocks_article_gallery_items_order_idx" ON "_articles_v_blocks_article_gallery_items" USING btree ("_order");
  CREATE INDEX "_articles_v_blocks_article_gallery_items_parent_id_idx" ON "_articles_v_blocks_article_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_blocks_article_gallery_items_asset_idx" ON "_articles_v_blocks_article_gallery_items" USING btree ("asset_id");
  CREATE INDEX "_articles_v_blocks_article_gallery_items_placement_idx" ON "_articles_v_blocks_article_gallery_items" USING btree ("placement_id");
  CREATE INDEX "_articles_v_blocks_article_gallery_order_idx" ON "_articles_v_blocks_article_gallery" USING btree ("_order");
  CREATE INDEX "_articles_v_blocks_article_gallery_parent_id_idx" ON "_articles_v_blocks_article_gallery" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_blocks_article_gallery_path_idx" ON "_articles_v_blocks_article_gallery" USING btree ("_path");
  CREATE INDEX "_articles_v_blocks_article_quote_order_idx" ON "_articles_v_blocks_article_quote" USING btree ("_order");
  CREATE INDEX "_articles_v_blocks_article_quote_parent_id_idx" ON "_articles_v_blocks_article_quote" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_blocks_article_quote_path_idx" ON "_articles_v_blocks_article_quote" USING btree ("_path");
  CREATE INDEX "_articles_v_blocks_article_callout_order_idx" ON "_articles_v_blocks_article_callout" USING btree ("_order");
  CREATE INDEX "_articles_v_blocks_article_callout_parent_id_idx" ON "_articles_v_blocks_article_callout" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_blocks_article_callout_path_idx" ON "_articles_v_blocks_article_callout" USING btree ("_path");
  CREATE INDEX "_articles_v_blocks_related_projects_order_idx" ON "_articles_v_blocks_related_projects" USING btree ("_order");
  CREATE INDEX "_articles_v_blocks_related_projects_parent_id_idx" ON "_articles_v_blocks_related_projects" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_blocks_related_projects_path_idx" ON "_articles_v_blocks_related_projects" USING btree ("_path");
  CREATE INDEX "_articles_v_parent_idx" ON "_articles_v" USING btree ("parent_id");
  CREATE INDEX "_articles_v_version_version__order_idx" ON "_articles_v" USING btree ("version__order");
  CREATE INDEX "_articles_v_version_version_slug_idx" ON "_articles_v" USING btree ("version_slug");
  CREATE INDEX "_articles_v_version_version_cover_image_idx" ON "_articles_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_articles_v_version_seo_version_seo_social_image_idx" ON "_articles_v" USING btree ("version_seo_social_image_id");
  CREATE INDEX "_articles_v_version_version_updated_at_idx" ON "_articles_v" USING btree ("version_updated_at");
  CREATE INDEX "_articles_v_version_version_created_at_idx" ON "_articles_v" USING btree ("version_created_at");
  CREATE INDEX "_articles_v_version_version_deleted_at_idx" ON "_articles_v" USING btree ("version_deleted_at");
  CREATE INDEX "_articles_v_version_version__status_idx" ON "_articles_v" USING btree ("version__status");
  CREATE INDEX "_articles_v_created_at_idx" ON "_articles_v" USING btree ("created_at");
  CREATE INDEX "_articles_v_updated_at_idx" ON "_articles_v" USING btree ("updated_at");
  CREATE INDEX "_articles_v_latest_idx" ON "_articles_v" USING btree ("latest");
  CREATE INDEX "_articles_v_rels_order_idx" ON "_articles_v_rels" USING btree ("order");
  CREATE INDEX "_articles_v_rels_parent_idx" ON "_articles_v_rels" USING btree ("parent_id");
  CREATE INDEX "_articles_v_rels_path_idx" ON "_articles_v_rels" USING btree ("path");
  CREATE INDEX "_articles_v_rels_projects_id_idx" ON "_articles_v_rels" USING btree ("projects_id");
  CREATE INDEX "pages_brand_overrides_usage_weights_order_idx" ON "pages_brand_overrides_usage_weights" USING btree ("_order");
  CREATE INDEX "pages_brand_overrides_usage_weights_parent_id_idx" ON "pages_brand_overrides_usage_weights" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_order_idx" ON "pages_blocks_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_parent_id_idx" ON "pages_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_path_idx" ON "pages_blocks_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_hero_image_idx" ON "pages_blocks_hero" USING btree ("image_id");
  CREATE INDEX "pages_blocks_rich_text_order_idx" ON "pages_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "pages_blocks_rich_text_parent_id_idx" ON "pages_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_rich_text_path_idx" ON "pages_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "pages_blocks_project_grid_order_idx" ON "pages_blocks_project_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_project_grid_parent_id_idx" ON "pages_blocks_project_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_project_grid_path_idx" ON "pages_blocks_project_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_media_order_idx" ON "pages_blocks_media" USING btree ("_order");
  CREATE INDEX "pages_blocks_media_parent_id_idx" ON "pages_blocks_media" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_media_path_idx" ON "pages_blocks_media" USING btree ("_path");
  CREATE INDEX "pages_blocks_media_asset_idx" ON "pages_blocks_media" USING btree ("asset_id");
  CREATE INDEX "pages_blocks_media_placement_idx" ON "pages_blocks_media" USING btree ("placement_id");
  CREATE INDEX "pages_blocks_custom_feature_order_idx" ON "pages_blocks_custom_feature" USING btree ("_order");
  CREATE INDEX "pages_blocks_custom_feature_parent_id_idx" ON "pages_blocks_custom_feature" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_custom_feature_path_idx" ON "pages_blocks_custom_feature" USING btree ("_path");
  CREATE INDEX "pages__order_idx" ON "pages" USING btree ("_order");
  CREATE INDEX "pages_restored_media_snapshot_idx" ON "pages" USING btree ("restored_media_snapshot_id");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_brand_profile_idx" ON "pages" USING btree ("brand_profile_id");
  CREATE INDEX "pages_seo_seo_social_image_idx" ON "pages" USING btree ("seo_social_image_id");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages_deleted_at_idx" ON "pages" USING btree ("deleted_at");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE INDEX "pages_rels_order_idx" ON "pages_rels" USING btree ("order");
  CREATE INDEX "pages_rels_parent_idx" ON "pages_rels" USING btree ("parent_id");
  CREATE INDEX "pages_rels_path_idx" ON "pages_rels" USING btree ("path");
  CREATE INDEX "pages_rels_projects_id_idx" ON "pages_rels" USING btree ("projects_id");
  CREATE INDEX "_pages_v_version_brand_overrides_usage_weights_order_idx" ON "_pages_v_version_brand_overrides_usage_weights" USING btree ("_order");
  CREATE INDEX "_pages_v_version_brand_overrides_usage_weights_parent_id_idx" ON "_pages_v_version_brand_overrides_usage_weights" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_order_idx" ON "_pages_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_parent_id_idx" ON "_pages_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_path_idx" ON "_pages_v_blocks_hero" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_hero_image_idx" ON "_pages_v_blocks_hero" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_rich_text_order_idx" ON "_pages_v_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_rich_text_parent_id_idx" ON "_pages_v_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_rich_text_path_idx" ON "_pages_v_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_project_grid_order_idx" ON "_pages_v_blocks_project_grid" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_project_grid_parent_id_idx" ON "_pages_v_blocks_project_grid" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_project_grid_path_idx" ON "_pages_v_blocks_project_grid" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_media_order_idx" ON "_pages_v_blocks_media" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_media_parent_id_idx" ON "_pages_v_blocks_media" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_media_path_idx" ON "_pages_v_blocks_media" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_media_asset_idx" ON "_pages_v_blocks_media" USING btree ("asset_id");
  CREATE INDEX "_pages_v_blocks_media_placement_idx" ON "_pages_v_blocks_media" USING btree ("placement_id");
  CREATE INDEX "_pages_v_blocks_custom_feature_order_idx" ON "_pages_v_blocks_custom_feature" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_custom_feature_parent_id_idx" ON "_pages_v_blocks_custom_feature" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_custom_feature_path_idx" ON "_pages_v_blocks_custom_feature" USING btree ("_path");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version__order_idx" ON "_pages_v" USING btree ("version__order");
  CREATE INDEX "_pages_v_version_version_restored_media_snapshot_idx" ON "_pages_v" USING btree ("version_restored_media_snapshot_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_version_brand_profile_idx" ON "_pages_v" USING btree ("version_brand_profile_id");
  CREATE INDEX "_pages_v_version_seo_version_seo_social_image_idx" ON "_pages_v" USING btree ("version_seo_social_image_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version_deleted_at_idx" ON "_pages_v" USING btree ("version_deleted_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE INDEX "_pages_v_rels_order_idx" ON "_pages_v_rels" USING btree ("order");
  CREATE INDEX "_pages_v_rels_parent_idx" ON "_pages_v_rels" USING btree ("parent_id");
  CREATE INDEX "_pages_v_rels_path_idx" ON "_pages_v_rels" USING btree ("path");
  CREATE INDEX "_pages_v_rels_projects_id_idx" ON "_pages_v_rels" USING btree ("projects_id");
  CREATE INDEX "technologies__order_idx" ON "technologies" USING btree ("_order");
  CREATE UNIQUE INDEX "technologies_slug_idx" ON "technologies" USING btree ("slug");
  CREATE INDEX "technologies_icon_idx" ON "technologies" USING btree ("icon_id");
  CREATE INDEX "technologies_updated_at_idx" ON "technologies" USING btree ("updated_at");
  CREATE INDEX "technologies_created_at_idx" ON "technologies" USING btree ("created_at");
  CREATE INDEX "technologies_deleted_at_idx" ON "technologies" USING btree ("deleted_at");
  CREATE INDEX "technologies__status_idx" ON "technologies" USING btree ("_status");
  CREATE INDEX "_technologies_v_parent_idx" ON "_technologies_v" USING btree ("parent_id");
  CREATE INDEX "_technologies_v_version_version__order_idx" ON "_technologies_v" USING btree ("version__order");
  CREATE INDEX "_technologies_v_version_version_slug_idx" ON "_technologies_v" USING btree ("version_slug");
  CREATE INDEX "_technologies_v_version_version_icon_idx" ON "_technologies_v" USING btree ("version_icon_id");
  CREATE INDEX "_technologies_v_version_version_updated_at_idx" ON "_technologies_v" USING btree ("version_updated_at");
  CREATE INDEX "_technologies_v_version_version_created_at_idx" ON "_technologies_v" USING btree ("version_created_at");
  CREATE INDEX "_technologies_v_version_version_deleted_at_idx" ON "_technologies_v" USING btree ("version_deleted_at");
  CREATE INDEX "_technologies_v_version_version__status_idx" ON "_technologies_v" USING btree ("version__status");
  CREATE INDEX "_technologies_v_created_at_idx" ON "_technologies_v" USING btree ("created_at");
  CREATE INDEX "_technologies_v_updated_at_idx" ON "_technologies_v" USING btree ("updated_at");
  CREATE INDEX "_technologies_v_latest_idx" ON "_technologies_v" USING btree ("latest");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE INDEX "media_deleted_at_idx" ON "media" USING btree ("deleted_at");
  CREATE INDEX "media__status_idx" ON "media" USING btree ("_status");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_small_sizes_small_filename_idx" ON "media" USING btree ("sizes_small_filename");
  CREATE INDEX "media_sizes_medium_sizes_medium_filename_idx" ON "media" USING btree ("sizes_medium_filename");
  CREATE INDEX "media_sizes_large_sizes_large_filename_idx" ON "media" USING btree ("sizes_large_filename");
  CREATE INDEX "_media_v_parent_idx" ON "_media_v" USING btree ("parent_id");
  CREATE INDEX "_media_v_version_version_updated_at_idx" ON "_media_v" USING btree ("version_updated_at");
  CREATE INDEX "_media_v_version_version_created_at_idx" ON "_media_v" USING btree ("version_created_at");
  CREATE INDEX "_media_v_version_version_deleted_at_idx" ON "_media_v" USING btree ("version_deleted_at");
  CREATE INDEX "_media_v_version_version__status_idx" ON "_media_v" USING btree ("version__status");
  CREATE INDEX "_media_v_version_version_filename_idx" ON "_media_v" USING btree ("version_filename");
  CREATE INDEX "_media_v_version_sizes_small_version_sizes_small_filenam_idx" ON "_media_v" USING btree ("version_sizes_small_filename");
  CREATE INDEX "_media_v_version_sizes_medium_version_sizes_medium_filen_idx" ON "_media_v" USING btree ("version_sizes_medium_filename");
  CREATE INDEX "_media_v_version_sizes_large_version_sizes_large_filenam_idx" ON "_media_v" USING btree ("version_sizes_large_filename");
  CREATE INDEX "_media_v_created_at_idx" ON "_media_v" USING btree ("created_at");
  CREATE INDEX "_media_v_updated_at_idx" ON "_media_v" USING btree ("updated_at");
  CREATE INDEX "_media_v_latest_idx" ON "_media_v" USING btree ("latest");
  CREATE INDEX "media_placements_placement_placement_asset_idx" ON "media_placements" USING btree ("placement_asset_id");
  CREATE INDEX "media_placements_updated_at_idx" ON "media_placements" USING btree ("updated_at");
  CREATE INDEX "media_placements_created_at_idx" ON "media_placements" USING btree ("created_at");
  CREATE INDEX "media_placements_deleted_at_idx" ON "media_placements" USING btree ("deleted_at");
  CREATE INDEX "media_placements__status_idx" ON "media_placements" USING btree ("_status");
  CREATE INDEX "_media_placements_v_parent_idx" ON "_media_placements_v" USING btree ("parent_id");
  CREATE INDEX "_media_placements_v_version_placement_version_placement__idx" ON "_media_placements_v" USING btree ("version_placement_asset_id");
  CREATE INDEX "_media_placements_v_version_version_updated_at_idx" ON "_media_placements_v" USING btree ("version_updated_at");
  CREATE INDEX "_media_placements_v_version_version_created_at_idx" ON "_media_placements_v" USING btree ("version_created_at");
  CREATE INDEX "_media_placements_v_version_version_deleted_at_idx" ON "_media_placements_v" USING btree ("version_deleted_at");
  CREATE INDEX "_media_placements_v_version_version__status_idx" ON "_media_placements_v" USING btree ("version__status");
  CREATE INDEX "_media_placements_v_created_at_idx" ON "_media_placements_v" USING btree ("created_at");
  CREATE INDEX "_media_placements_v_updated_at_idx" ON "_media_placements_v" USING btree ("updated_at");
  CREATE INDEX "_media_placements_v_latest_idx" ON "_media_placements_v" USING btree ("latest");
  CREATE INDEX "brand_profiles_colors_order_idx" ON "brand_profiles_colors" USING btree ("_order");
  CREATE INDEX "brand_profiles_colors_parent_id_idx" ON "brand_profiles_colors" USING btree ("_parent_id");
  CREATE INDEX "brand_profiles_usage_weights_order_idx" ON "brand_profiles_usage_weights" USING btree ("_order");
  CREATE INDEX "brand_profiles_usage_weights_parent_id_idx" ON "brand_profiles_usage_weights" USING btree ("_parent_id");
  CREATE INDEX "brand_profiles__order_idx" ON "brand_profiles" USING btree ("_order");
  CREATE UNIQUE INDEX "brand_profiles_slug_idx" ON "brand_profiles" USING btree ("slug");
  CREATE INDEX "brand_profiles_updated_at_idx" ON "brand_profiles" USING btree ("updated_at");
  CREATE INDEX "brand_profiles_created_at_idx" ON "brand_profiles" USING btree ("created_at");
  CREATE INDEX "brand_profiles_deleted_at_idx" ON "brand_profiles" USING btree ("deleted_at");
  CREATE INDEX "brand_profiles__status_idx" ON "brand_profiles" USING btree ("_status");
  CREATE INDEX "brand_profiles_rels_order_idx" ON "brand_profiles_rels" USING btree ("order");
  CREATE INDEX "brand_profiles_rels_parent_idx" ON "brand_profiles_rels" USING btree ("parent_id");
  CREATE INDEX "brand_profiles_rels_path_idx" ON "brand_profiles_rels" USING btree ("path");
  CREATE INDEX "brand_profiles_rels_media_id_idx" ON "brand_profiles_rels" USING btree ("media_id");
  CREATE INDEX "_brand_profiles_v_version_colors_order_idx" ON "_brand_profiles_v_version_colors" USING btree ("_order");
  CREATE INDEX "_brand_profiles_v_version_colors_parent_id_idx" ON "_brand_profiles_v_version_colors" USING btree ("_parent_id");
  CREATE INDEX "_brand_profiles_v_version_usage_weights_order_idx" ON "_brand_profiles_v_version_usage_weights" USING btree ("_order");
  CREATE INDEX "_brand_profiles_v_version_usage_weights_parent_id_idx" ON "_brand_profiles_v_version_usage_weights" USING btree ("_parent_id");
  CREATE INDEX "_brand_profiles_v_parent_idx" ON "_brand_profiles_v" USING btree ("parent_id");
  CREATE INDEX "_brand_profiles_v_version_version__order_idx" ON "_brand_profiles_v" USING btree ("version__order");
  CREATE INDEX "_brand_profiles_v_version_version_slug_idx" ON "_brand_profiles_v" USING btree ("version_slug");
  CREATE INDEX "_brand_profiles_v_version_version_updated_at_idx" ON "_brand_profiles_v" USING btree ("version_updated_at");
  CREATE INDEX "_brand_profiles_v_version_version_created_at_idx" ON "_brand_profiles_v" USING btree ("version_created_at");
  CREATE INDEX "_brand_profiles_v_version_version_deleted_at_idx" ON "_brand_profiles_v" USING btree ("version_deleted_at");
  CREATE INDEX "_brand_profiles_v_version_version__status_idx" ON "_brand_profiles_v" USING btree ("version__status");
  CREATE INDEX "_brand_profiles_v_created_at_idx" ON "_brand_profiles_v" USING btree ("created_at");
  CREATE INDEX "_brand_profiles_v_updated_at_idx" ON "_brand_profiles_v" USING btree ("updated_at");
  CREATE INDEX "_brand_profiles_v_latest_idx" ON "_brand_profiles_v" USING btree ("latest");
  CREATE INDEX "_brand_profiles_v_rels_order_idx" ON "_brand_profiles_v_rels" USING btree ("order");
  CREATE INDEX "_brand_profiles_v_rels_parent_idx" ON "_brand_profiles_v_rels" USING btree ("parent_id");
  CREATE INDEX "_brand_profiles_v_rels_path_idx" ON "_brand_profiles_v_rels" USING btree ("path");
  CREATE INDEX "_brand_profiles_v_rels_media_id_idx" ON "_brand_profiles_v_rels" USING btree ("media_id");
  CREATE INDEX "preview_snapshots_source_collection_idx" ON "preview_snapshots" USING btree ("source_collection");
  CREATE INDEX "preview_snapshots_source_document_id_idx" ON "preview_snapshots" USING btree ("source_document_id");
  CREATE INDEX "preview_snapshots_source_version_id_idx" ON "preview_snapshots" USING btree ("source_version_id");
  CREATE UNIQUE INDEX "preview_snapshots_manifest_hash_idx" ON "preview_snapshots" USING btree ("manifest_hash");
  CREATE INDEX "preview_snapshots_created_by_idx" ON "preview_snapshots" USING btree ("created_by_id");
  CREATE INDEX "preview_snapshots_updated_at_idx" ON "preview_snapshots" USING btree ("updated_at");
  CREATE INDEX "preview_snapshots_created_at_idx" ON "preview_snapshots" USING btree ("created_at");
  CREATE INDEX "releases_quality_order_idx" ON "releases_quality" USING btree ("_order");
  CREATE INDEX "releases_quality_parent_id_idx" ON "releases_quality" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "releases_git_commit_idx" ON "releases" USING btree ("git_commit");
  CREATE INDEX "releases_preview_snapshot_idx" ON "releases" USING btree ("preview_snapshot_id");
  CREATE INDEX "releases_draft_snapshot_idx" ON "releases" USING btree ("draft_snapshot_id");
  CREATE INDEX "releases_created_by_idx" ON "releases" USING btree ("created_by_id");
  CREATE INDEX "releases_updated_at_idx" ON "releases" USING btree ("updated_at");
  CREATE INDEX "releases_created_at_idx" ON "releases" USING btree ("created_at");
  CREATE INDEX "assistance_proposals_target_page_idx" ON "assistance_proposals" USING btree ("target_page_id");
  CREATE INDEX "assistance_proposals_source_snapshot_idx" ON "assistance_proposals" USING btree ("source_snapshot_id");
  CREATE INDEX "assistance_proposals_created_by_idx" ON "assistance_proposals" USING btree ("created_by_id");
  CREATE INDEX "assistance_proposals_decided_by_idx" ON "assistance_proposals" USING btree ("decided_by_id");
  CREATE INDEX "assistance_proposals_updated_at_idx" ON "assistance_proposals" USING btree ("updated_at");
  CREATE INDEX "assistance_proposals_created_at_idx" ON "assistance_proposals" USING btree ("created_at");
  CREATE INDEX "restore_plans_release_idx" ON "restore_plans" USING btree ("release_id");
  CREATE INDEX "restore_plans_target_page_idx" ON "restore_plans" USING btree ("target_page_id");
  CREATE INDEX "restore_plans_target_snapshot_idx" ON "restore_plans" USING btree ("target_snapshot_id");
  CREATE INDEX "restore_plans_target_draft_snapshot_idx" ON "restore_plans" USING btree ("target_draft_snapshot_id");
  CREATE INDEX "restore_plans_baseline_snapshot_idx" ON "restore_plans" USING btree ("baseline_snapshot_id");
  CREATE INDEX "restore_plans_created_by_idx" ON "restore_plans" USING btree ("created_by_id");
  CREATE INDEX "restore_plans_confirmation_snapshot_idx" ON "restore_plans" USING btree ("confirmation_snapshot_id");
  CREATE INDEX "restore_plans_confirmed_by_idx" ON "restore_plans" USING btree ("confirmed_by_id");
  CREATE INDEX "restore_plans_result_draft_snapshot_idx" ON "restore_plans" USING btree ("result_draft_snapshot_id");
  CREATE INDEX "restore_plans_result_preview_snapshot_idx" ON "restore_plans" USING btree ("result_preview_snapshot_id");
  CREATE INDEX "restore_plans_executed_by_idx" ON "restore_plans" USING btree ("executed_by_id");
  CREATE INDEX "restore_plans_updated_at_idx" ON "restore_plans" USING btree ("updated_at");
  CREATE INDEX "restore_plans_created_at_idx" ON "restore_plans" USING btree ("created_at");
  CREATE INDEX "draft_snapshots_source_document_id_idx" ON "draft_snapshots" USING btree ("source_document_id");
  CREATE INDEX "draft_snapshots_source_version_id_idx" ON "draft_snapshots" USING btree ("source_version_id");
  CREATE UNIQUE INDEX "draft_snapshots_capsule_hash_idx" ON "draft_snapshots" USING btree ("capsule_hash");
  CREATE INDEX "draft_snapshots_created_by_idx" ON "draft_snapshots" USING btree ("created_by_id");
  CREATE INDEX "draft_snapshots_updated_at_idx" ON "draft_snapshots" USING btree ("updated_at");
  CREATE INDEX "draft_snapshots_created_at_idx" ON "draft_snapshots" USING btree ("created_at");
  CREATE UNIQUE INDEX "publication_bundles_bundle_hash_idx" ON "publication_bundles" USING btree ("bundle_hash");
  CREATE INDEX "publication_bundles_created_by_idx" ON "publication_bundles" USING btree ("created_by_id");
  CREATE INDEX "publication_bundles_updated_at_idx" ON "publication_bundles" USING btree ("updated_at");
  CREATE INDEX "publication_bundles_created_at_idx" ON "publication_bundles" USING btree ("created_at");
  CREATE UNIQUE INDEX "publication_reviews_bundle_idx" ON "publication_reviews" USING btree ("bundle_id");
  CREATE INDEX "publication_reviews_decided_by_idx" ON "publication_reviews" USING btree ("decided_by_id");
  CREATE UNIQUE INDEX "publication_reviews_review_hash_idx" ON "publication_reviews" USING btree ("review_hash");
  CREATE INDEX "publication_reviews_updated_at_idx" ON "publication_reviews" USING btree ("updated_at");
  CREATE INDEX "publication_reviews_created_at_idx" ON "publication_reviews" USING btree ("created_at");
  CREATE UNIQUE INDEX "publication_artifacts_review_idx" ON "publication_artifacts" USING btree ("review_id");
  CREATE INDEX "publication_artifacts_bundle_idx" ON "publication_artifacts" USING btree ("bundle_id");
  CREATE UNIQUE INDEX "publication_artifacts_artifact_hash_idx" ON "publication_artifacts" USING btree ("artifact_hash");
  CREATE INDEX "publication_artifacts_created_by_idx" ON "publication_artifacts" USING btree ("created_by_id");
  CREATE INDEX "publication_artifacts_updated_at_idx" ON "publication_artifacts" USING btree ("updated_at");
  CREATE INDEX "publication_artifacts_created_at_idx" ON "publication_artifacts" USING btree ("created_at");
  CREATE INDEX "publication_preflights_artifact_idx" ON "publication_preflights" USING btree ("artifact_id");
  CREATE UNIQUE INDEX "publication_preflights_preflight_hash_idx" ON "publication_preflights" USING btree ("preflight_hash");
  CREATE INDEX "publication_preflights_created_by_idx" ON "publication_preflights" USING btree ("created_by_id");
  CREATE INDEX "publication_preflights_updated_at_idx" ON "publication_preflights" USING btree ("updated_at");
  CREATE INDEX "publication_preflights_created_at_idx" ON "publication_preflights" USING btree ("created_at");
  CREATE INDEX "figma_import_plans_source_file_key_idx" ON "figma_import_plans" USING btree ("source_file_key");
  CREATE INDEX "figma_import_plans_node_id_idx" ON "figma_import_plans" USING btree ("node_id");
  CREATE UNIQUE INDEX "figma_import_plans_plan_hash_idx" ON "figma_import_plans" USING btree ("plan_hash");
  CREATE INDEX "figma_import_plans_created_by_idx" ON "figma_import_plans" USING btree ("created_by_id");
  CREATE INDEX "figma_import_plans_updated_at_idx" ON "figma_import_plans" USING btree ("updated_at");
  CREATE INDEX "figma_import_plans_created_at_idx" ON "figma_import_plans" USING btree ("created_at");
  CREATE UNIQUE INDEX "figma_import_reviews_plan_idx" ON "figma_import_reviews" USING btree ("plan_id");
  CREATE INDEX "figma_import_reviews_decided_by_idx" ON "figma_import_reviews" USING btree ("decided_by_id");
  CREATE UNIQUE INDEX "figma_import_reviews_review_hash_idx" ON "figma_import_reviews" USING btree ("review_hash");
  CREATE INDEX "figma_import_reviews_updated_at_idx" ON "figma_import_reviews" USING btree ("updated_at");
  CREATE INDEX "figma_import_reviews_created_at_idx" ON "figma_import_reviews" USING btree ("created_at");
  CREATE UNIQUE INDEX "figma_import_executions_review_idx" ON "figma_import_executions" USING btree ("review_id");
  CREATE INDEX "figma_import_executions_plan_idx" ON "figma_import_executions" USING btree ("plan_id");
  CREATE UNIQUE INDEX "figma_import_executions_media_idx" ON "figma_import_executions" USING btree ("media_id");
  CREATE UNIQUE INDEX "figma_import_executions_placement_idx" ON "figma_import_executions" USING btree ("placement_id");
  CREATE UNIQUE INDEX "figma_import_executions_content_hash_idx" ON "figma_import_executions" USING btree ("content_hash");
  CREATE INDEX "figma_import_executions_imported_by_idx" ON "figma_import_executions" USING btree ("imported_by_id");
  CREATE UNIQUE INDEX "figma_import_executions_execution_hash_idx" ON "figma_import_executions" USING btree ("execution_hash");
  CREATE INDEX "figma_import_executions_updated_at_idx" ON "figma_import_executions" USING btree ("updated_at");
  CREATE INDEX "figma_import_executions_created_at_idx" ON "figma_import_executions" USING btree ("created_at");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "audit_events_actor_idx" ON "audit_events" USING btree ("actor_id");
  CREATE INDEX "audit_events_action_idx" ON "audit_events" USING btree ("action");
  CREATE INDEX "audit_events_subject_collection_idx" ON "audit_events" USING btree ("subject_collection");
  CREATE INDEX "audit_events_subject_id_idx" ON "audit_events" USING btree ("subject_id");
  CREATE INDEX "audit_events_updated_at_idx" ON "audit_events" USING btree ("updated_at");
  CREATE INDEX "audit_events_created_at_idx" ON "audit_events" USING btree ("created_at");
  CREATE INDEX "analytics_snapshots_source_idx" ON "analytics_snapshots" USING btree ("source");
  CREATE INDEX "analytics_snapshots_period_from_idx" ON "analytics_snapshots" USING btree ("period_from");
  CREATE INDEX "analytics_snapshots_period_to_idx" ON "analytics_snapshots" USING btree ("period_to");
  CREATE UNIQUE INDEX "analytics_snapshots_snapshot_hash_idx" ON "analytics_snapshots" USING btree ("snapshot_hash");
  CREATE INDEX "analytics_snapshots_created_by_idx" ON "analytics_snapshots" USING btree ("created_by_id");
  CREATE INDEX "analytics_snapshots_updated_at_idx" ON "analytics_snapshots" USING btree ("updated_at");
  CREATE INDEX "analytics_snapshots_created_at_idx" ON "analytics_snapshots" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("projects_id");
  CREATE INDEX "payload_locked_documents_rels_articles_id_idx" ON "payload_locked_documents_rels" USING btree ("articles_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_technologies_id_idx" ON "payload_locked_documents_rels" USING btree ("technologies_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_media_placements_id_idx" ON "payload_locked_documents_rels" USING btree ("media_placements_id");
  CREATE INDEX "payload_locked_documents_rels_brand_profiles_id_idx" ON "payload_locked_documents_rels" USING btree ("brand_profiles_id");
  CREATE INDEX "payload_locked_documents_rels_preview_snapshots_id_idx" ON "payload_locked_documents_rels" USING btree ("preview_snapshots_id");
  CREATE INDEX "payload_locked_documents_rels_releases_id_idx" ON "payload_locked_documents_rels" USING btree ("releases_id");
  CREATE INDEX "payload_locked_documents_rels_assistance_proposals_id_idx" ON "payload_locked_documents_rels" USING btree ("assistance_proposals_id");
  CREATE INDEX "payload_locked_documents_rels_restore_plans_id_idx" ON "payload_locked_documents_rels" USING btree ("restore_plans_id");
  CREATE INDEX "payload_locked_documents_rels_draft_snapshots_id_idx" ON "payload_locked_documents_rels" USING btree ("draft_snapshots_id");
  CREATE INDEX "payload_locked_documents_rels_publication_bundles_id_idx" ON "payload_locked_documents_rels" USING btree ("publication_bundles_id");
  CREATE INDEX "payload_locked_documents_rels_publication_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("publication_reviews_id");
  CREATE INDEX "payload_locked_documents_rels_publication_artifacts_id_idx" ON "payload_locked_documents_rels" USING btree ("publication_artifacts_id");
  CREATE INDEX "payload_locked_documents_rels_publication_preflights_id_idx" ON "payload_locked_documents_rels" USING btree ("publication_preflights_id");
  CREATE INDEX "payload_locked_documents_rels_figma_import_plans_id_idx" ON "payload_locked_documents_rels" USING btree ("figma_import_plans_id");
  CREATE INDEX "payload_locked_documents_rels_figma_import_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("figma_import_reviews_id");
  CREATE INDEX "payload_locked_documents_rels_figma_import_executions_id_idx" ON "payload_locked_documents_rels" USING btree ("figma_import_executions_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_audit_events_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_events_id");
  CREATE INDEX "payload_locked_documents_rels_analytics_snapshots_id_idx" ON "payload_locked_documents_rels" USING btree ("analytics_snapshots_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "_assistant_settings_v_created_at_idx" ON "_assistant_settings_v" USING btree ("created_at");
  CREATE INDEX "_assistant_settings_v_updated_at_idx" ON "_assistant_settings_v" USING btree ("updated_at");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "projects_blocks_case_section" CASCADE;
  DROP TABLE "projects_blocks_case_media" CASCADE;
  DROP TABLE "projects_blocks_case_gallery_items" CASCADE;
  DROP TABLE "projects_blocks_case_gallery" CASCADE;
  DROP TABLE "projects_blocks_case_quote" CASCADE;
  DROP TABLE "projects_blocks_case_metrics_items" CASCADE;
  DROP TABLE "projects_blocks_case_metrics" CASCADE;
  DROP TABLE "projects_blocks_case_feature" CASCADE;
  DROP TABLE "projects_technologies" CASCADE;
  DROP TABLE "projects" CASCADE;
  DROP TABLE "projects_rels" CASCADE;
  DROP TABLE "_projects_v_blocks_case_section" CASCADE;
  DROP TABLE "_projects_v_blocks_case_media" CASCADE;
  DROP TABLE "_projects_v_blocks_case_gallery_items" CASCADE;
  DROP TABLE "_projects_v_blocks_case_gallery" CASCADE;
  DROP TABLE "_projects_v_blocks_case_quote" CASCADE;
  DROP TABLE "_projects_v_blocks_case_metrics_items" CASCADE;
  DROP TABLE "_projects_v_blocks_case_metrics" CASCADE;
  DROP TABLE "_projects_v_blocks_case_feature" CASCADE;
  DROP TABLE "_projects_v_version_technologies" CASCADE;
  DROP TABLE "_projects_v" CASCADE;
  DROP TABLE "_projects_v_rels" CASCADE;
  DROP TABLE "articles_blocks_article_text" CASCADE;
  DROP TABLE "articles_blocks_article_media" CASCADE;
  DROP TABLE "articles_blocks_article_gallery_items" CASCADE;
  DROP TABLE "articles_blocks_article_gallery" CASCADE;
  DROP TABLE "articles_blocks_article_quote" CASCADE;
  DROP TABLE "articles_blocks_article_callout" CASCADE;
  DROP TABLE "articles_blocks_related_projects" CASCADE;
  DROP TABLE "articles" CASCADE;
  DROP TABLE "articles_rels" CASCADE;
  DROP TABLE "_articles_v_blocks_article_text" CASCADE;
  DROP TABLE "_articles_v_blocks_article_media" CASCADE;
  DROP TABLE "_articles_v_blocks_article_gallery_items" CASCADE;
  DROP TABLE "_articles_v_blocks_article_gallery" CASCADE;
  DROP TABLE "_articles_v_blocks_article_quote" CASCADE;
  DROP TABLE "_articles_v_blocks_article_callout" CASCADE;
  DROP TABLE "_articles_v_blocks_related_projects" CASCADE;
  DROP TABLE "_articles_v" CASCADE;
  DROP TABLE "_articles_v_rels" CASCADE;
  DROP TABLE "pages_brand_overrides_usage_weights" CASCADE;
  DROP TABLE "pages_blocks_hero" CASCADE;
  DROP TABLE "pages_blocks_rich_text" CASCADE;
  DROP TABLE "pages_blocks_project_grid" CASCADE;
  DROP TABLE "pages_blocks_media" CASCADE;
  DROP TABLE "pages_blocks_custom_feature" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "pages_rels" CASCADE;
  DROP TABLE "_pages_v_version_brand_overrides_usage_weights" CASCADE;
  DROP TABLE "_pages_v_blocks_hero" CASCADE;
  DROP TABLE "_pages_v_blocks_rich_text" CASCADE;
  DROP TABLE "_pages_v_blocks_project_grid" CASCADE;
  DROP TABLE "_pages_v_blocks_media" CASCADE;
  DROP TABLE "_pages_v_blocks_custom_feature" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "_pages_v_rels" CASCADE;
  DROP TABLE "technologies" CASCADE;
  DROP TABLE "_technologies_v" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "_media_v" CASCADE;
  DROP TABLE "media_placements" CASCADE;
  DROP TABLE "_media_placements_v" CASCADE;
  DROP TABLE "brand_profiles_colors" CASCADE;
  DROP TABLE "brand_profiles_usage_weights" CASCADE;
  DROP TABLE "brand_profiles" CASCADE;
  DROP TABLE "brand_profiles_rels" CASCADE;
  DROP TABLE "_brand_profiles_v_version_colors" CASCADE;
  DROP TABLE "_brand_profiles_v_version_usage_weights" CASCADE;
  DROP TABLE "_brand_profiles_v" CASCADE;
  DROP TABLE "_brand_profiles_v_rels" CASCADE;
  DROP TABLE "preview_snapshots" CASCADE;
  DROP TABLE "releases_quality" CASCADE;
  DROP TABLE "releases" CASCADE;
  DROP TABLE "assistance_proposals" CASCADE;
  DROP TABLE "restore_plans" CASCADE;
  DROP TABLE "draft_snapshots" CASCADE;
  DROP TABLE "publication_bundles" CASCADE;
  DROP TABLE "publication_reviews" CASCADE;
  DROP TABLE "publication_artifacts" CASCADE;
  DROP TABLE "publication_preflights" CASCADE;
  DROP TABLE "figma_import_plans" CASCADE;
  DROP TABLE "figma_import_reviews" CASCADE;
  DROP TABLE "figma_import_executions" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "audit_events" CASCADE;
  DROP TABLE "analytics_snapshots" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "assistant_settings" CASCADE;
  DROP TABLE "_assistant_settings_v" CASCADE;
  DROP TYPE "public"."enum_projects_blocks_case_feature_feature_key";
  DROP TYPE "public"."enum_projects_status";
  DROP TYPE "public"."enum__projects_v_blocks_case_feature_feature_key";
  DROP TYPE "public"."enum__projects_v_version_status";
  DROP TYPE "public"."enum_articles_blocks_article_callout_tone";
  DROP TYPE "public"."enum_articles_status";
  DROP TYPE "public"."enum__articles_v_blocks_article_callout_tone";
  DROP TYPE "public"."enum__articles_v_version_status";
  DROP TYPE "public"."enum_pages_brand_overrides_usage_weights_role";
  DROP TYPE "public"."enum_pages_blocks_custom_feature_feature_key";
  DROP TYPE "public"."enum_pages_brand_overrides_motion_easing";
  DROP TYPE "public"."enum_pages_brand_overrides_motion_reduced_motion";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_version_brand_overrides_usage_weights_role";
  DROP TYPE "public"."enum__pages_v_blocks_custom_feature_feature_key";
  DROP TYPE "public"."enum__pages_v_version_brand_overrides_motion_easing";
  DROP TYPE "public"."enum__pages_v_version_brand_overrides_motion_reduced_motion";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum_technologies_status";
  DROP TYPE "public"."enum__technologies_v_version_status";
  DROP TYPE "public"."enum_media_status";
  DROP TYPE "public"."enum__media_v_version_status";
  DROP TYPE "public"."enum_media_placements_placement_fit";
  DROP TYPE "public"."enum_media_placements_placement_frame";
  DROP TYPE "public"."media_mobile_fit";
  DROP TYPE "public"."media_mobile_frame";
  DROP TYPE "public"."media_tablet_fit";
  DROP TYPE "public"."media_tablet_frame";
  DROP TYPE "public"."enum_media_placements_status";
  DROP TYPE "public"."enum__media_placements_v_version_placement_fit";
  DROP TYPE "public"."enum__media_placements_v_version_placement_frame";
  DROP TYPE "public"."enum__media_placements_v_version_status";
  DROP TYPE "public"."enum_brand_profiles_colors_role";
  DROP TYPE "public"."enum_brand_profiles_usage_weights_role";
  DROP TYPE "public"."enum_brand_profiles_motion_easing";
  DROP TYPE "public"."enum_brand_profiles_motion_reduced_motion";
  DROP TYPE "public"."enum_brand_profiles_status";
  DROP TYPE "public"."enum__brand_profiles_v_version_colors_role";
  DROP TYPE "public"."enum__brand_profiles_v_version_usage_weights_role";
  DROP TYPE "public"."enum__brand_profiles_v_version_motion_easing";
  DROP TYPE "public"."enum__brand_profiles_v_version_motion_reduced_motion";
  DROP TYPE "public"."enum__brand_profiles_v_version_status";
  DROP TYPE "public"."enum_releases_quality_viewport";
  DROP TYPE "public"."enum_releases_quality_source";
  DROP TYPE "public"."enum_assistance_proposals_capability";
  DROP TYPE "public"."enum_assistance_proposals_status";
  DROP TYPE "public"."enum_restore_plans_status";
  DROP TYPE "public"."enum_publication_reviews_decision";
  DROP TYPE "public"."enum_publication_preflights_status";
  DROP TYPE "public"."enum_figma_import_plans_status";
  DROP TYPE "public"."enum_figma_import_plans_candidate_type";
  DROP TYPE "public"."enum_figma_import_reviews_decision";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_audit_events_outcome";`)
}
