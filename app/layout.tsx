import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Hollywood SoC Simulator",
	description: "Wii Starlet ARM926EJ-S + Broadway PPC750CL simulator",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body
				style={{ margin: 0, padding: 0, overflow: "hidden", height: "100vh" }}
			>
				{children}
			</body>
		</html>
	);
}
