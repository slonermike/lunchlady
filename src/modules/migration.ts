import { Site, EntryOrder } from "../types/site";

/**
 * Update the site version from none to verion 0.
 *
 * @param site Site to update the version.
 */
function migrateSite_noneTo0(site: any): any {
    if (site.siteVersion === undefined) {
        Object.keys(site.sections).forEach((key) => {
            const section = site.sections[key];
            section.entryOrder = EntryOrder.DATE;
        });
        if (!site.divs) site.divs = [];
        if (!site.css) site.css = [];
        site.siteVersion = 0;
    }

    return site;
}

/**
 * Update the site version from 0 to verion 1.
 *
 * @param site Site to update the version.
 */
function migrateSite_0to1(site: any): any {
    if (site.siteVersion === 0) {
        site.sectionOrder = [];
        Object.keys(site.sections).forEach((key) => {
            site.sectionOrder.push(key);
        });
        site.siteVersion = 1;
    }

    return site;
}

/**
 * Update the site from 1 to 2.  CSS and headers/divs
 * were moved from being selected individually to being
 * selected collectively from the themes folder.
 *
 * @param site Site to update the version.
 */
function migrateSite_1to2(site: any): Site {
    if (site.siteVersion === 1) {
        site.themes = [];
        const oldDivs = site.divs;
        site.divs = {
            headers: oldDivs
        };
        site.siteVersion = 2;
    }

    return site;
}

/**
 * Update the site version to the latest.
 *
 * @param site Site to update the version.
 */
export function migrateSiteData(site: Site): Site {
    if (site.siteVersion === undefined) {
        site = migrateSite_noneTo0(site);
    }
    if (site.siteVersion === 0) {
        site = migrateSite_0to1(site);
    }
    if (site.siteVersion === 1) {
        site = migrateSite_1to2(site);
    }

    return site;
}