import { useState } from "react";

/* eslint-disable camelcase */
import Card from "components/atoms/Card/card";
import NivoScatterPlot, { ScatterChartMetadata } from "components/molecules/NivoScatterChart/nivo-scatter-chart";

import { ScatterChartDataItems } from "components/molecules/NivoScatterChart/nivo-scatter-chart";

import { useMediaQuery } from "lib/hooks/useMediaQuery";
import { calcDaysFromToday } from "lib/utils/date-utils";
import usePullRequests from "lib/hooks/api/usePullRequests";
import { getAvatarByUsername } from "lib/utils/github";
import DashboardStatsJumbotron from "components/molecules/DashboardStatsJumbotron";

type ContributorPrMap = { [contributor: string]: DbRepoPR };
export type PrStatusFilter = "open" | "closed" | "all";

export interface DashboardProps {
  repositories?: number[];
  prData?: DbRepoPR[];
}

const Dashboard = ({ repositories }: DashboardProps): JSX.Element => {
  const { data: prData, isError: prError } = usePullRequests(undefined, repositories);
  const [showBots, setShowBots] = useState(false);
  const isMobile = useMediaQuery("(max-width:720px)");
  const [prStateFilter, setPrStateFilter] = useState<PrStatusFilter>("all");

  const handleSetPrFilter = (state: PrStatusFilter) => {
    setPrStateFilter(state);
  };

  let scatterChartData: ScatterChartDataItems[] = [];
  let metadata: ScatterChartMetadata = {
    allPrs: prData.length,
    openPrs: prData.filter((pr) => pr.state.toLowerCase() === "open").length,
    closedPrs: prData.filter((pr) => pr.state.toLowerCase() === "closed" || pr.state.toLowerCase() === "merged").length,
  };

  const uniqueContributors: ContributorPrMap = prData.reduce((prs, curr) => {
    if (curr.state.toLowerCase() !== prStateFilter && prStateFilter !== "all") return prs;

    if (prs[curr.author_login]) {
      prs[curr.author_login].linesCount += Math.abs(curr.additions - curr.deletions);
    } else {
      prs[curr.author_login] = { ...curr };
      prs[curr.author_login].linesCount = Math.abs(curr.additions - curr.deletions);
    }

    return prs;
  }, {} as ContributorPrMap);

  const prs = Object.keys(uniqueContributors)
    .filter((key) => {
      if (showBots) {
        return true;
      }

      return !key.includes("[bot]");
    })
    .map((key) => uniqueContributors[key]);

  if (prError) {
    scatterChartData = [];
  } else {
    scatterChartData = prs.map(({ updated_at, linesCount, author_login }) => {
      const author_image = author_login.includes("[bot]") ? "octocat" : author_login;

      const data = {
        x: calcDaysFromToday(new Date(updated_at)),
        y: linesCount,
        contributor: author_login,
        image: getAvatarByUsername(author_image, 40),
      };
      return data;
    });
  }

  const maxFilesModified = scatterChartData.reduce((max, curr) => {
    const { y } = curr;
    if (Number(y) > max) {
      return y as number;
    }
    return max;
  }, 0);

  return (
    <div className="flex flex-col w-full gap-4">
      <DashboardStatsJumbotron prData={prData} repositories={repositories} />
      <section className="flex flex-col max-w-full gap-4 mb-6 lg:flex-row">
        <div className="flex flex-col w-full">
          <Card className="w-full">
            <NivoScatterPlot
              title="Contributor Distribution"
              showBots={showBots}
              setShowBots={setShowBots}
              data={[{ id: "Contributors", data: scatterChartData }]}
              maxFilesModified={maxFilesModified}
              isMobile={isMobile}
              repositories={repositories}
              metadata={metadata}
              handleSetPrFilter={handleSetPrFilter}
            />
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
