import * as React from "react";

interface IFooterProps {
    githubLink: string;
    twitterLink: string;
    facebookLink: string;
    instagramLink: string;
    developerLink: string;
    renderBottomLinks: boolean;
}

export const Footer = ({
    githubLink,
    twitterLink,
    facebookLink,
    instagramLink,
    developerLink,
    renderBottomLinks,
}: IFooterProps): JSX.Element => {
    return (
        <footer className="footer_area">
            <div className="container">
                {renderBottomLinks && (
                    <div className="social_links">
                        <ul>
                            <li>
                                <a href={twitterLink}>
                                    <img
                                        src={require("../../images/twitter.svg")}
                                        alt=""
                                    />
                                </a>
                            </li>
                            <li>
                                <a href={facebookLink}>
                                    <img
                                        src={require("../../images/facebook.svg")}
                                        alt=""
                                    />
                                </a>
                            </li>
                            <li>
                                <a href={instagramLink}>
                                    <img
                                        src={require("../../images/instagram.svg")}
                                        alt=""
                                    />
                                </a>
                            </li>
                            <li>
                                <a href={githubLink}>
                                    <img
                                        src={require("../../images/github.svg")}
                                        alt=""
                                    />
                                </a>
                            </li>
                        </ul>
                    </div>
                )}
                {renderBottomLinks && (
                    <div className="footer_cnt">
                        <a href={developerLink}>
                            <p>&copy; Develop by EDEACODE</p>
                        </a>
                    </div>
                )}
            </div>
        </footer>
    );
};
