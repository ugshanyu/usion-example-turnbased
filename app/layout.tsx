export const metadata = {
  title: 'Space Invaders Duel',
  description: 'Turn-based multiplayer battleship game on Usion',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
