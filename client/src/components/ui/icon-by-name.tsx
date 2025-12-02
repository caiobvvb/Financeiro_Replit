import { cn } from "@/lib/utils";

export const fluentIconMap: Record<string, string> = {
    Utensils: "Fork and knife with plate",
    ShoppingCart: "Shopping bags",
    ShoppingBasket: "Shopping cart",
    CreditCard: "Credit card",
    Home: "House",
    Car: "Automobile",
    Bus: "Bus",
    Bike: "Bicycle",
    Fuel: "Fuel pump",
    Phone: "Mobile phone",
    Wifi: "Antenna bars",
    FileText: "Page facing up",
    Gift: "Wrapped gift",
    Stethoscope: "Stethoscope",
    School: "Graduation cap",
    Dumbbell: "Person lifting weights",
    Pill: "Pill",
    Tv: "Television",
    Hammer: "Hammer",
    Wrench: "Wrench",
    Briefcase: "Briefcase",
    Wallet: "Purse",
    TrendingUp: "Chart increasing",
    DollarSign: "Dollar banknote",
    Coins: "Coin",
    PiggyBank: "Piggy bank",
    Banknote: "Money with wings",
    Heart: "Heart suit",
    PlayCircle: "Play button",
    Coffee: "Hot beverage",
    MoneyBag: "Money bag",
    TrendingDown: "Chart decreasing",
};

export function IconByName({ name, className }: { name?: string | null; className?: string }) {
    const key = (name || "").trim();
    // Fallback to Lucide if not in fluent map, or just use a default fluent icon
    const fluentName = fluentIconMap[key] || "Pushpin";

    // Construct URL. Note: We use the raw github url. 
    // Structure: https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/[Name]/3D/[name]_3d.png
    // We need to handle spaces in the folder name and the file name (snake_case for file).

    const folderName = fluentName; // e.g. "Fork and knife with plate"
    const fileName = fluentName.toLowerCase().replace(/ /g, "_") + "_3d.png"; // e.g. "fork_and_knife_with_plate_3d.png"

    const url = `https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/${encodeURIComponent(folderName)}/3D/${fileName}`;

    return (
        <img
            src={url}
            alt={key}
            className={cn("object-contain", className)}
            loading="lazy"
            onError={(e) => {
                // Fallback if image fails to load
                (e.target as HTMLImageElement).style.display = 'none';
            }}
        />
    );
}
