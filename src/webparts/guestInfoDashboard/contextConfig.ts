/* eslint-disable no-var */
import { WebPartContext } from "@microsoft/sp-webpart-base";

var _context: WebPartContext;

export const getContext = (context?: WebPartContext): WebPartContext => {
    if (context) {
        //You must add the @pnp/logging package to include the PnPLogging behavior it is no longer a peer dependency
        // The LogLevel set's at what level a message will be written to the console
        _context = context;
    }
    return _context;
};
