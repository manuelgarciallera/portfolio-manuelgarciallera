'use client';

import { useState } from 'react';
import type { Project } from '@/types';
import { GlassCard } from './GlassCard';
import { Tag } from './Tag';

interface ProjectCardProps {
  project: Project;
  isDark?: boolean;
  onClick?: (project: Project) => void;
}

export function ProjectCard({ project, isDark = true, onClick }: ProjectCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <GlassCard
      hoverable
      padding="none"
      className="group cursor-pointer overflow-hidden"
      onClick={() => onClick?.(project)}
      role="button"
      tabIndex={0}
    >
      <div className="relative overflow-hidden" style={{ height: '220px' }}>
        {project.thumbnail && !imgError ? (
          <img
            src={project.thumbnail}
            alt={project.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background: `linear-gradient(135deg, ${project.color}40 0%, ${project.color}15 100%)`,
            }}
          />
        )}

        <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/20" />

        <span className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[11px] font-medium text-white/80 backdrop-blur-sm">
          {project.year}
        </span>
      </div>

      <div className="flex flex-col gap-3 p-5">
        <Tag variant="teal" isDark={isDark}>
          {project.category}
        </Tag>

        <h3 className="text-[18px] font-semibold leading-tight" style={{ color: 'var(--text)' }}>
          {project.title}
        </h3>

        {project.description && (
          <p className="line-clamp-2 text-[14px] leading-relaxed" style={{ color: 'var(--text-sec)' }}>
            {project.description}
          </p>
        )}

        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {project.tags.slice(0, 3).map((tag) => (
              <Tag key={tag} variant="outline" isDark={isDark}>
                {tag}
              </Tag>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
