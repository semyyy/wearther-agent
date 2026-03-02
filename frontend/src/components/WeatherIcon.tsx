import type { IconGroup } from "../lib/weatherCodes";

interface Props {
  group: IconGroup;
  className?: string;
}

export default function WeatherIcon({ group, className }: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {group === "clear" && <SunIcon />}
      {group === "partly-cloudy" && <PartlyCloudyIcon />}
      {group === "overcast" && <CloudIcon />}
      {group === "fog" && <FogIcon />}
      {group === "drizzle" && <DrizzleIcon />}
      {group === "rain" && <RainIcon />}
      {group === "snow" && <SnowIcon />}
      {group === "thunderstorm" && <ThunderstormIcon />}
    </svg>
  );
}

function SunIcon() {
  return (
    <>
      <circle cx="32" cy="32" r="12" fill="#FFD93D" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <line
          key={angle}
          x1="32"
          y1="32"
          x2={32 + 20 * Math.cos((angle * Math.PI) / 180)}
          y2={32 + 20 * Math.sin((angle * Math.PI) / 180)}
          stroke="#FFD93D"
          strokeWidth="3"
          strokeLinecap="round"
        />
      ))}
    </>
  );
}

function PartlyCloudyIcon() {
  return (
    <>
      <circle cx="22" cy="24" r="10" fill="#FFD93D" />
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <line
          key={angle}
          x1="22"
          y1="24"
          x2={22 + 15 * Math.cos((angle * Math.PI) / 180)}
          y2={24 + 15 * Math.sin((angle * Math.PI) / 180)}
          stroke="#FFD93D"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}
      <path
        d="M18 44c-4.4 0-8-3.6-8-8s3.6-8 8-8c.7-4 4.2-7 8.4-7 3.8 0 7 2.5 8 6 .3 0 .6-.1.9-.1 3.8 0 7 3.1 7 7s-3.1 7-7 7H18z"
        fill="white"
        opacity="0.95"
      />
    </>
  );
}

function CloudIcon() {
  return (
    <path
      d="M16 44c-5 0-9-4-9-9s4-9 9-9c.8-4.5 4.8-8 9.6-8 4.3 0 8 2.8 9.2 6.8.4 0 .8-.1 1.2-.1 4.4 0 8 3.6 8 8s-3.6 8-8 8H16z"
      fill="#B0BEC5"
    />
  );
}

function FogIcon() {
  return (
    <>
      <line x1="10" y1="24" x2="54" y2="24" stroke="#B0BEC5" strokeWidth="3" strokeLinecap="round" />
      <line x1="14" y1="32" x2="50" y2="32" stroke="#B0BEC5" strokeWidth="3" strokeLinecap="round" />
      <line x1="10" y1="40" x2="54" y2="40" stroke="#B0BEC5" strokeWidth="3" strokeLinecap="round" />
      <line x1="18" y1="48" x2="46" y2="48" stroke="#B0BEC5" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
    </>
  );
}

function DrizzleIcon() {
  return (
    <>
      <path
        d="M16 36c-4 0-7-3-7-7s3-7 7-7c.6-3.5 3.7-6 7.4-6 3.3 0 6.1 2.2 7.1 5.2.3 0 .7-.1 1-.1 3.3 0 6 2.7 6 6s-2.7 6-6 6H16z"
        fill="#90A4AE"
      />
      <circle cx="20" cy="44" r="1.5" fill="#64B5F6" />
      <circle cx="28" cy="48" r="1.5" fill="#64B5F6" />
      <circle cx="36" cy="44" r="1.5" fill="#64B5F6" />
    </>
  );
}

function RainIcon() {
  return (
    <>
      <path
        d="M16 34c-4 0-7-3-7-7s3-7 7-7c.6-3.5 3.7-6 7.4-6 3.3 0 6.1 2.2 7.1 5.2.3 0 .7-.1 1-.1 3.3 0 6 2.7 6 6s-2.7 6-6 6H16z"
        fill="#78909C"
      />
      <line x1="18" y1="40" x2="15" y2="50" stroke="#42A5F5" strokeWidth="2" strokeLinecap="round" />
      <line x1="26" y1="40" x2="23" y2="50" stroke="#42A5F5" strokeWidth="2" strokeLinecap="round" />
      <line x1="34" y1="40" x2="31" y2="50" stroke="#42A5F5" strokeWidth="2" strokeLinecap="round" />
      <line x1="42" y1="38" x2="39" y2="48" stroke="#42A5F5" strokeWidth="2" strokeLinecap="round" />
    </>
  );
}

function SnowIcon() {
  return (
    <>
      <path
        d="M16 34c-4 0-7-3-7-7s3-7 7-7c.6-3.5 3.7-6 7.4-6 3.3 0 6.1 2.2 7.1 5.2.3 0 .7-.1 1-.1 3.3 0 6 2.7 6 6s-2.7 6-6 6H16z"
        fill="#90A4AE"
      />
      <circle cx="18" cy="42" r="2" fill="white" />
      <circle cx="28" cy="46" r="2" fill="white" />
      <circle cx="38" cy="42" r="2" fill="white" />
      <circle cx="23" cy="50" r="2" fill="white" />
      <circle cx="33" cy="52" r="2" fill="white" />
    </>
  );
}

function ThunderstormIcon() {
  return (
    <>
      <path
        d="M16 32c-4 0-7-3-7-7s3-7 7-7c.6-3.5 3.7-6 7.4-6 3.3 0 6.1 2.2 7.1 5.2.3 0 .7-.1 1-.1 3.3 0 6 2.7 6 6s-2.7 6-6 6H16z"
        fill="#546E7A"
      />
      <polygon points="30,34 24,46 29,46 26,56 38,42 32,42 36,34" fill="#FFD93D" />
    </>
  );
}
