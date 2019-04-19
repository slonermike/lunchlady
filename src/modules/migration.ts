import { Site, EntryOrder } from "../types/site";

/**
 * Update the site version from none to verion 0.
 *
 * @param site Site to update the version.
 */
function migrateSite_noneTo0(site: Site): Site {
    if (site.siteVersion === undefined) {
        Object.keys(site.sections).forEach((key) => {
            const section = site.sections[key];
            section.entryOrder = EntryOrder.DATE;
        });
        if (!site.css) site.css = [];
        site.siteVersion = 0;
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

    return site;
}