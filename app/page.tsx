export default function Home() {
  return (
    <div className="w-screen h-screen flex items-center justify-center flex-col gap-4">
      <a href="/chat" className="text-3xl font-bold ">
        Go to chat &#8594;
      </a>

      <p className="opacity-60 text-sm">Instructions in the SUBMISSION_README.md</p>
    </div>
  );
}
