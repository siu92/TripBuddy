const ICONS = {
  flight: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Airplane.png",
  stay: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Beach%20with%20Umbrella.png",
  traveler: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Luggage.png",
  plan: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Luggage.png",
  budget: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Luggage.png",
};

export default function Premium3dIcon({ type = "plan", alt = "" }) {
  return <div className={`premium-3d-wrapper premium-3d-${type}`} aria-hidden={!alt}><span className="glow-backdrop" /><img src={ICONS[type] || ICONS.plan} alt={alt} /></div>;
}
