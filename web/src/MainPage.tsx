import React from 'react'
import { FaColumns, FaDesktop, FaFolder, FaMarkdown, FaDollarSign, FaWindows, FaLinux, FaMobile } from 'react-icons/fa'
import { MdOfflinePin, MdCloudDownload } from 'react-icons/md'
import { Link } from 'react-router-dom';

function MainPage() {
    return (
        <div className="container mx-auto px-4">
            <div className="relative w-full h-96 mb-12 bg-cover bg-center rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-60"></div>
                <img
                    src="/2dTaskBoard/screenshot.png"
                    alt="Panoramic view"
                    className="absolute inset-0 w-full h-full object-cover filter blur-sm"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <h1 className="text-5xl font-bold text-center mb-12 drop-shadow-lg">2dTaskBoard</h1>
                    <Link
                        to="/board"
                        className="animate-bounce bg-blue-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-600 text-lg shadow-lg"
                    >
                        Get Started
                    </Link>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 text-gray-300">
                <FeatureSection
                    icon={<FaColumns className="text-4xl text-blue-500" />}
                    title="2D Organization"
                    description="Split your tasks into both columns and rows, providing a more flexible and intuitive way to manage your projects."
                />
                <FeatureSection
                    icon={<MdOfflinePin className="text-4xl text-green-500" />}
                    title="Offline Functionality"
                    description="All your data is stored locally, ensuring you can access and modify your tasks even without an internet connection."
                />
                <FeatureSection
                    icon={<FaFolder className="text-4xl text-yellow-500" />}
                    title="File System Integration"
                    description="Leverage your existing backup and versioning tools to track changes, as the app is built on a file system-based architecture."
                />
                <FeatureSection
                    icon={<FaDesktop className="text-4xl text-purple-500" />}
                    title="Human-Readable Format"
                    description="Your tasks are stored in a format that's easy to read and edit, even outside of the application, giving you full control over your data."
                />
                <FeatureSection
                    icon={<FaMarkdown className="text-4xl text-red-500" />}
                    title="Markdown Support"
                    description="Format your tasks using Markdown, allowing for rich text formatting and improved readability of your task descriptions."
                />
                <FeatureSection
                    icon={<FaDollarSign className="text-4xl text-green-500" />}
                    title="Free of Charge"
                    description="Enjoy all the features of this powerful task board application completely free, with no hidden costs or premium tiers."
                />
            </div>

            <div className="mt-20 mb-16">
                <h2 className="text-3xl font-bold text-white mb-10">
                    <MdCloudDownload className="inline-block mr-2 mb-1" />
                    Download
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <DownloadCard
                        icon={<FaMobile className="text-4xl text-blue-400" />}
                        title="Web App (PWA)"
                        description="Use directly in your browser or install as a Progressive Web App for a native-like experience."
                        buttonText="Use Web App"
                        buttonLink="https://www.piotrek-k.pl/2dTaskBoard/board"
                    />
                    <DownloadCard
                        icon={<FaLinux className="text-4xl text-yellow-400" />}
                        title="Linux"
                        description="Download the AppImage for easy installation on any Linux distribution or get it from Flathub."
                        buttons={[
                            {
                                text: "Download AppImage",
                                link: "https://github.com/piotrek-k/2dTaskBoard/releases"
                            },
                            {
                                text: "Get on Flathub",
                                link: "https://flathub.org/apps/io.github.piotrek_k._2dTaskBoard"
                            }
                        ]}
                    />
                    <DownloadCard
                        icon={<FaWindows className="text-4xl text-blue-500" />}
                        title="Windows"
                        description="Download the installer for Windows to use 2dTaskBoard on your PC."
                        buttonText="Download for Windows"
                        buttonLink="https://github.com/piotrek-k/2dTaskBoard/releases"
                    />
                </div>
            </div>

            <footer className="mt-12 text-center text-gray-800 text-sm">
                <p>&copy; 2024 - {new Date().getFullYear()} "2dTaskBoard" Piotr Kozerski</p>
            </footer>
        </div>
    )
}

function FeatureSection({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">{icon}</div>
            <div>
                <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
                <p>{description}</p>
            </div>
        </div>
    )
}

function DownloadCard({
    icon,
    title,
    description,
    buttonText,
    buttonLink,
    buttons
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    buttonText?: string;
    buttonLink?: string;
    buttons?: Array<{ text: string, link: string }>;
}) {
    return (
        <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center text-center transition-transform hover:scale-105 hover:shadow-xl h-full">
            <div className="mb-4">{icon}</div>
            <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
            <p className="text-gray-300 mb-5 flex-grow">{description}</p>

            <div className="mt-auto w-full">
                {buttonText && buttonLink && (
                    <a
                        href={buttonLink}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors mb-3 w-full block"
                    >
                        {buttonText}
                    </a>
                )}

                {buttons && buttons.map((button, index) => (
                    <a
                        key={index}
                        href={button.link}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors mb-3 w-full block"
                    >
                        {button.text}
                    </a>
                ))}
            </div>
        </div>
    )
}

export default MainPage