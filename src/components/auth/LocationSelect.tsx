
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LocationSelectProps {
  onLocationChange: (county: string, constituency: string) => void;
  required?: boolean;
}

const locationData = {
  "Baringo County": ["Baringo North", "Baringo Central", "Baringo South", "Mogotio", "Eldama Ravine", "Tiaty"],
  "Bomet County": ["Bomet East", "Bomet Central", "Sotik", "Chepalungu", "Konoin"],
  "Bungoma County": ["Mt. Elgon", "Sirisia", "Kabuchai", "Bumula", "Kanduyi", "Webuye East", "Webuye West", "Kimilili", "Tongaren"],
  "Busia County": ["Teso North", "Teso South", "Nambale", "Matayos", "Butula", "Funyula", "Budalangi"],
  "Elgeyo-Marakwet County": ["Marakwet East", "Marakwet West", "Keiyo North", "Keiyo South"],
  "Embu County": ["Manyatta", "Runyenjes", "Mbeere South", "Mbeere North"],
  "Garissa County": ["Garissa Township", "Balambala", "Lagdera", "Dadaab", "Fafi", "Ijara"],
  "Homa Bay County": ["Kasipul", "Kabondo Kasipul", "Karachuonyo", "Rangwe", "Homa Bay Town", "Ndhiwa", "Suba North", "Suba South"],
  "Isiolo County": ["Isiolo North", "Isiolo South"],
  "Kajiado County": ["Kajiado North", "Kajiado Central", "Kajiado East", "Kajiado West", "Kajiado South"],
  "Kakamega County": ["Lugari", "Likuyani", "Malava", "Lurambi", "Navakholo", "Mumias West", "Mumias East", "Matungu", "Butere", "Khwisero", "Shinyalu", "Ikolomani"],
  "Kericho County": ["Kipkelion East", "Kipkelion West", "Ainamoi", "Bureti", "Belgut", "Sigowet/Soin"],
  "Kiambu County": ["Gatundu South", "Gatundu North", "Juja", "Thika Town", "Ruiru", "Githunguri", "Kiambu", "Kiambaa", "Kabete", "Kikuyu", "Limuru", "Lari"],
  "Kilifi County": ["Kilifi North", "Kilifi South", "Kaloleni", "Rabai", "Ganze", "Malindi", "Magarini"],
  "Kirinyaga County": ["Mwea", "Gichugu", "Ndia", "Kirinyaga Central"],
  "Kisii County": ["Bonchari", "South Mugirango", "Bomachoge Borabu", "Bobasi", "Bomachoge Chache", "Nyaribari Masaba", "Nyaribari Chache", "Kitutu Chache North", "Kitutu Chache South"],
  "Kisumu County": ["Kisumu East", "Kisumu West", "Kisumu Central", "Seme", "Nyando", "Muhoroni", "Nyakach"],
  "Kitui County": ["Mwingi North", "Mwingi West", "Mwingi Central", "Kitui West", "Kitui Rural", "Kitui Central", "Kitui East", "Kitui South"],
  "Kwale County": ["Msambweni", "Lunga Lunga", "Matuga", "Kinango"],
  "Laikipia County": ["Laikipia West", "Laikipia East", "Laikipia North"],
  "Lamu County": ["Lamu East", "Lamu West"],
  "Machakos County": ["Machakos Town", "Mavoko", "Masinga", "Yatta", "Kangundo", "Matungulu", "Kathiani", "Mwala"],
  "Makueni County": ["Makueni", "Kaiti", "Kibwezi West", "Kibwezi East", "Kilome", "Mbooni"],
  "Mandera County": ["Mandera West", "Banissa", "Mandera North", "Mandera South", "Mandera East", "Lafey"],
  "Marsabit County": ["Moyale", "North Horr", "Saku", "Laisamis"],
  "Meru County": ["Igembe South", "Igembe Central", "Igembe North", "Tigania West", "Tigania East", "North Imenti", "Buuri", "Central Imenti", "South Imenti"],
  "Migori County": ["Rongo", "Awendo", "Suna East", "Suna West", "Uriri", "Nyatike", "Kuria West", "Kuria East"],
  "Mombasa County": ["Changamwe", "Jomba", "Kisauni", "Nyali", "Likoni", "Mvita"],
  "Murang'a County": ["Kangema", "Mathioya", "Kiharu", "Kigumo", "Maragwa", "Kandara", "Gatanga"],
  "Nairobi County": ["Westlands", "Dagoretti North", "Dagoretti South", "Langata", "Kibra", "Roysambu", "Kasarani", "Ruaraka", "Embakasi South", "Embakasi North", "Embakasi Central", "Embakasi East", "Embakasi West", "Makadara", "Kamukunji", "Starehe", "Mathare"],
  "Nakuru County": ["Njoro", "Molo", "Gilgil", "Naivasha", "Nakuru Town West", "Nakuru Town East", "Kuresoi South", "Kuresoi North", "Subukia", "Rongai", "Bahati"],
  "Nandi County": ["Tinderet", "Aldai", "Nandi Hills", "Chesumei", "Emgwen", "Mosop"],
  "Narok County": ["Kajiado North", "Transmara West", "Transmara East", "Narok North", "Narok East", "Narok South", "Narok West"],
  "Nyamira County": ["West Mugirango", "North Mugirango", "Borabu", "Kitutu Masaba"],
  "Nyandarua County": ["Kinangop", "Kipipiri", "Ol Kalou", "Ol Joro Orok", "Ndaragwa"],
  "Nyeri County": ["Tetu", "Kieni", "Mathira", "Othaya", "Mukurweini", "Nyeri Town"],
  "Samburu County": ["Samburu West", "Samburu North", "Samburu East"],
  "Siaya County": ["Ugenya", "Ugunja", "Alego Usonga", "Gem", "Bondo", "Rarieda"],
  "Taita-Taveta County": ["Taveta", "Wundanyi", "Mwatate", "Voi"],
  "Tana River County": ["Garsen", "Galole", "Bura"],
  "Tharaka-Nithi County": ["Tharaka", "Chuka/Igambang'ombe", "Maara"],
  "Trans Nzoia County": ["Cherangany", "Endebess", "Saboti", "Kiminini", "Kwanza"],
  "Turkana County": ["Turkana North", "Turkana West", "Turkana Central", "Loima", "Turkana South", "Turkana East"],
  "Uasin Gishu County": ["Soy", "Turbo", "Moiben", "Ainabkoi", "Kapseret", "Kesses"],
  "Vihiga County": ["Vihiga", "Sabatia", "Hamisi", "Luanda", "Emuhaya"],
  "Wajir County": ["Wajir North", "Wajir East", "Tarbaj", "Wajir West", "Eldas", "Wajir South"],
  "West Pokot County": ["Sigor", "Kacheliba", "Kapenguria", "West Pokot"]
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
