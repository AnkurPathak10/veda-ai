"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TOOLKIT_TOOLS } from "@/lib/toolkit/tools";

export function ToolkitHubPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
            <h1 className="text-2xl font-bold tracking-tight text-[#1a1a1a]">
              AI Teacher&apos;s Toolkit
            </h1>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-[#6b7280]">
            Quick AI tools to help you plan lessons, create practice materials,
            and prepare revision handouts from your chapter documents.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {TOOLKIT_TOOLS.map((tool) => {
            const Icon = tool.icon;

            return (
              <Link
                key={tool.id}
                href={tool.href}
                className="group rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm transition-colors hover:border-[#d1d5db] hover:bg-[#fafafa]"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tool.accent}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-base font-bold text-[#1a1a1a]">
                        {tool.title}
                      </h2>
                      <ArrowRight className="h-4 w-4 shrink-0 text-[#9ca3af] transition-transform group-hover:translate-x-0.5 group-hover:text-[#1a1a1a]" />
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[#6b7280]">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
