import * as React from "react";
import { getCurrentUserProfile } from "../../services/list.service";
interface IHeaderProps {
    backgroundColor: string;
    imageUrl: string;
}
const getLuminance = (color: string): number => {
    if (!color) {
        // Default to white if color is null or undefined
        color = '#ffffff';
    }

    const rgbMatch = color.match(/\w\w/g);
    if (!rgbMatch) {
        // Default to white if color is not in the expected format
        return 1; // Luminance of white
    }

    const rgb = rgbMatch.map((c: string) => parseInt(c, 16));
    const [r, g, b] = rgb.map((c: number) => {
        c /= 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const isColorDark = (color: string): boolean => {
    const luminance = getLuminance(color);
    return luminance < 0.5; // Adjust threshold as needed
};

export const Header = ({
    backgroundColor,
    imageUrl
}: IHeaderProps): JSX.Element => {
    const [userName, setUserName] = React.useState<string>('');
    const [userPicture, setUserPicture] = React.useState<string>('');
    const [fontColor, setFontColor] = React.useState<string>('black');

    React.useEffect(() => {
        const fetchUserProfile = async (): Promise<void> => {
            const userProfile = await getCurrentUserProfile();
            setUserName(userProfile?.name);
            setUserPicture(userProfile?.pictureUrl || require("../../images/default-user.png")); // Use default image if pictureUrl is undefined
        };

        fetchUserProfile();

        // Determine font color based on background color
        if (backgroundColor) {
            const color = isColorDark(backgroundColor) ? 'white' : 'black';
            setFontColor(color);
        }
    }, [backgroundColor]);

    return (
        <header style={{ backgroundColor: backgroundColor }} className="header_area">
            <div className="containerHeader">
                <div className="header_main">
                    <div className="header_left">
                        <div style={{ color: fontColor }} className="header_user">
                            {userName}
                            <a href="#">
                                <img
                                    src={userPicture}
                                    alt={userName}
                                />

                            </a>
                            {/* <p>19-07-2024</p> */}
                        </div>
                    </div>
                    <div className="header_right">
                        <div className="header_logo">
                            <a href="#">
                                <img
                                    src={imageUrl}
                                    alt="Logo"
                                />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
