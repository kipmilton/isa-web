
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LocationSelectProps {
  onLocationChange: (county: string, constituency: string) => void;
  required?: boolean;
}

const locationData = {
  "Nairobi County": [
    "Westlands", "Dagoretti North", "Dagoretti South", "Langata", "Kibra", 
    "Roysambu", "Kasarani", "Ruaraka", "Embakasi South", "Embakasi North", 
    "Embakasi Central", "Embakasi East", "Embakasi West", "Makadara", 
    "Kamukunji", "Starehe", "Mathare"
  ],
  "Kiambu County": [
    "Gatundu South", "Gatundu North", "Juja", "Thika Town", "Ruiru", 
    "Githunguri", "Kiambu", "Kiambaa", "Kabete", "Kikuyu", "Limuru", "Lari"
  ]
};

const LocationSelect = ({ onLocationChange, required = false }: LocationSelectProps) => {
  const [selectedCounty, setSelectedCounty] = useState<string>("");
  const [selectedConstituency, setSelectedConstituency] = useState<string>("");

  const handleCountyChange = (county: string) => {
    setSelectedCounty(county);
    setSelectedConstituency(""); // Reset constituency when county changes
    onLocationChange(county, "");
  };

  const handleConstituencyChange = (constituency: string) => {
    setSelectedConstituency(constituency);
    onLocationChange(selectedCounty, constituency);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="county">County</Label>
        <Select value={selectedCounty} onValueChange={handleCountyChange} required={required}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select County" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(locationData).map((county) => (
              <SelectItem key={county} value={county}>
                {county}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {selectedCounty && (
        <div>
          <Label htmlFor="constituency">Constituency</Label>
          <Select value={selectedConstituency} onValueChange={handleConstituencyChange} required={required}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select Constituency" />
            </SelectTrigger>
            <SelectContent>
              {locationData[selectedCounty as keyof typeof locationData].map((constituency) => (
                <SelectItem key={constituency} value={constituency}>
                  {constituency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default LocationSelect;
