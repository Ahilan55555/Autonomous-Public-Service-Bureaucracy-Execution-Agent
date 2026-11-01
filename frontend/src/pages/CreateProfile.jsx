/* eslint-disable react-refresh/only-export-components */
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UserRound, ArrowRight, ShieldCheck, RefreshCw, GraduationCap, Briefcase, CalendarDays } from "lucide-react";
import { apiClient } from "../api/client";
import "../App.css";

export const stateDistricts = {
    "Andhra Pradesh": [
        "Alluri Sitharama Raju", "Anakapalli", "Anantapur", "Annamayya",
        "Bapatla", "Chittoor", "Dr. B.R. Ambedkar Konaseema", "East Godavari",
        "Eluru", "Guntur", "Kakinada", "Krishna", "Kurnool", "Nandyal",
        "NTR", "Palnadu", "Parvathipuram Manyam", "Prakasam",
        "Sri Potti Sriramulu Nellore", "Sri Sathya Sai", "Srikakulam",
        "Tirupati", "Visakhapatnam", "Vizianagaram", "West Godavari",
        "YSR Kadapa"
    ],

    "Arunachal Pradesh": [
        "Anjaw", "Bichom", "Changlang", "Dibang Valley", "East Kameng",
        "East Siang", "Itanagar Capital Complex", "Kamle", "Keyi Panyor",
        "Kra Daadi", "Kurung Kumey", "Lepa Rada", "Lohit", "Longding",
        "Lower Dibang Valley", "Lower Siang", "Lower Subansiri", "Namsai",
        "Pakke-Kessang", "Papum Pare", "Shi-Yomi", "Siang", "Tawang",
        "Tirap", "Upper Siang", "Upper Subansiri", "West Kameng",
        "West Siang"
    ],

    "Assam": [
        "Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar",
        "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri",
        "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi",
        "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan", "Karbi Anglong",
        "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon",
        "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar",
        "Tamulpur", "Tinsukia", "Udalguri", "West Karbi Anglong"
    ],

    "Bihar": [
        "Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur",
        "Bhojpur", "Buxar", "Darbhanga", "East Champaran", "Gaya",
        "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria",
        "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger",
        "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas",
        "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar",
        "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"
    ],

    "Chhattisgarh": [
        "Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara",
        "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg",
        "Gariaband", "Gaurela-Pendra-Marwahi", "Janjgir-Champa",
        "Jashpur", "Kabirdham", "Kanker", "Khairagarh-Chhuikhadan-Gandai",
        "Kondagaon", "Korba", "Koriya", "Mahasamund", "Manendragarh-Chirmiri-Bharatpur",
        "Mohla-Manpur-Ambagarh Chowki", "Mungeli", "Narayanpur",
        "Raigarh", "Raipur", "Rajnandgaon", "Sakti", "Sarangarh-Bilaigarh",
        "Sukma", "Surajpur", "Surguja"
    ],

    "Goa": ["North Goa", "South Goa"],

    "Gujarat": [
        "Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha",
        "Bharuch", "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod",
        "Dang", "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath",
        "Jamnagar", "Junagadh", "Kachchh", "Kheda", "Mahisagar",
        "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal",
        "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat",
        "Surendranagar", "Tapi", "Vadodara", "Valsad"
    ],

    "Haryana": [
        "Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad",
        "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal",
        "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula",
        "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"
    ],

    "Himachal Pradesh": [
        "Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur",
        "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur",
        "Solan", "Una"
    ],

    "Jharkhand": [
        "Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum",
        "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara",
        "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu",
        "Ramgarh", "Ranchi", "Sahebganj", "Seraikela-Kharsawan",
        "Simdega", "West Singhbhum"
    ],

    "Karnataka": [
        "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural",
        "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikkaballapur",
        "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere",
        "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu",
        "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara",
        "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada",
        "Vijayanagara", "Vijayapura", "Yadgir"
    ],

    "Kerala": [
        "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod",
        "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad",
        "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"
    ],

    "Madhya Pradesh": [
        "Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat",
        "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur",
        "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori",
        "Guna", "Gwalior", "Harda", "Indore", "Jabalpur", "Jhabua",
        "Katni", "Khandwa", "Khargone", "Maihar", "Mandla", "Mandsaur",
        "Mauganj", "Morena", "Narmadapuram", "Narsinghpur", "Neemuch",
        "Niwari", "Pandhurna", "Panna", "Raisen", "Rajgarh", "Ratlam",
        "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol",
        "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli",
        "Tikamgarh", "Ujjain", "Umaria", "Vidisha"
    ],

    "Maharashtra": [
        "Ahilyanagar", "Akola", "Amravati", "Beed", "Bhandara",
        "Buldhana", "Chandrapur", "Chhatrapati Sambhajinagar", "Dharashiv",
        "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon",
        "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban",
        "Nagpur", "Nanded", "Nandurbar", "Nashik", "Palghar", "Parbhani",
        "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg",
        "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"
    ],

    "Manipur": [
        "Bishnupur", "Chandel", "Churachandpur", "Imphal East",
        "Imphal West", "Jiribam", "Kakching", "Kamjong", "Kangpokpi",
        "Noney", "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal",
        "Thoubal", "Ukhrul"
    ],

    "Meghalaya": [
        "East Garo Hills", "East Jaintia Hills", "East Khasi Hills",
        "Eastern West Khasi Hills", "North Garo Hills", "Ri-Bhoi",
        "South Garo Hills", "South West Garo Hills",
        "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills",
        "West Khasi Hills"
    ],

    "Mizoram": [
        "Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib",
        "Lawngtlai", "Lunglei", "Mamit", "Saiha", "Saitual", "Serchhip"
    ],

    "Nagaland": [
        "Chumoukedima", "Dimapur", "Kiphire", "Kohima", "Longleng",
        "Meluri", "Mokokchung", "Mon", "Niuland", "Noklak", "Peren",
        "Phek", "Shamator", "Tseminyu", "Tuensang", "Wokha", "Zunheboto"
    ],

    "Odisha": [
        "Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak",
        "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati",
        "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi",
        "Kandhamal", "Kendrapara", "Kendujhar", "Khordha", "Koraput",
        "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh",
        "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur",
        "Sundargarh"
    ],

    "Punjab": [
        "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib",
        "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar",
        "Kapurthala", "Ludhiana", "Malerkotla", "Mansa", "Moga",
        "Pathankot", "Patiala", "Rupnagar", "Sahibzada Ajit Singh Nagar",
        "Sangrur", "Shaheed Bhagat Singh Nagar", "Sri Muktsar Sahib",
        "Tarn Taran"
    ],

    "Rajasthan": [
        "Ajmer", "Alwar", "Anupgarh", "Balotra", "Banswara", "Baran",
        "Barmer", "Beawar", "Bharatpur", "Bhilwara", "Bikaner", "Bundi",
        "Chittorgarh", "Churu", "Dausa", "Deeg", "Dholpur", "Didwana-Kuchaman",
        "Dungarpur", "Ganganagar", "Hanumangarh", "Jaipur", "Jaisalmer",
        "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kekri",
        "Khairthal-Tijara", "Kota", "Kotputli-Behror", "Nagaur", "Neem Ka Thana",
        "Pali", "Phalodi", "Pratapgarh", "Rajsamand", "Salumbar", "Sanchore",
        "Sawai Madhopur", "Shahpura", "Sikar", "Sirohi", "Tonk", "Udaipur"
    ],

    "Sikkim": [
        "Gangtok", "Gyalshing", "Mangan", "Namchi", "Pakyong", "Soreng"
    ],

    "Tamil Nadu": [
        "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore",
        "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kancheepuram",
        "Kanniyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
        "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai",
        "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi",
        "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
        "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai",
        "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"
    ],

    "Telangana": [
        "Adilabad", "Bhadradri Kothagudem", "Hanamkonda", "Hyderabad",
        "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal",
        "Kamareddy", "Karimnagar", "Khammam", "Kumuram Bheem Asifabad",
        "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal-Malkajgiri",
        "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal",
        "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy",
        "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy",
        "Warangal", "Yadadri Bhuvanagiri"
    ],

    "Tripura": [
        "Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala",
        "South Tripura", "Unakoti", "West Tripura"
    ],

    "Uttar Pradesh": [
        "Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha",
        "Auraiya", "Ayodhya", "Azamgarh", "Baghpat", "Bahraich",
        "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly",
        "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr",
        "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah",
        "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar",
        "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur",
        "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi",
        "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi",
        "Kheri", "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj",
        "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur",
        "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh",
        "Prayagraj", "Raebareli", "Rampur", "Saharanpur", "Sambhal",
        "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti",
        "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao",
        "Varanasi"
    ],

    "Uttarakhand": [
        "Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun",
        "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh",
        "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar",
        "Uttarkashi"
    ],

    "West Bengal": [
        "Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur",
        "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram",
        "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia",
        "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur",
        "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas",
        "Uttar Dinajpur"
    ],

    "Andaman and Nicobar Islands": [
        "Nicobar", "North and Middle Andaman", "South Andaman"
    ],

    "Chandigarh": ["Chandigarh"],

    "Dadra and Nagar Haveli and Daman and Diu": [
        "Dadra and Nagar Haveli", "Daman", "Diu"
    ],

    "Delhi": [
        "Central Delhi", "East Delhi", "New Delhi", "North Delhi",
        "North East Delhi", "North West Delhi", "Shahdara", "South Delhi",
        "South East Delhi", "South West Delhi", "West Delhi"
    ],

    "Jammu and Kashmir": [
        "Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda",
        "Ganderbal", "Jammu", "Kathua", "Kishtwar", "Kulgam",
        "Kupwara", "Poonch", "Pulwama", "Rajouri", "Ramban",
        "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"
    ],

    "Ladakh": ["Kargil", "Leh"],

    "Lakshadweep": [
        "Agatti", "Amini", "Andrott", "Bitra", "Chetlat", "Kadmat",
        "Kalpeni", "Kavaratti", "Kiltan", "Minicoy"
    ],

    "Puducherry": [
        "Karaikal", "Mahe", "Puducherry", "Yanam"
    ]
};

export const indianStates = Object.keys(stateDistricts).sort((a, b) => a.localeCompare(b));

function getTodayIso() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function formatToDisplayDob(val) {
    if (!val) return "";
    const str = String(val).trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
        return str;
    }
    const isoPart = str.split("T")[0];
    const parts = isoPart.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
        const [year, month, day] = parts;
        return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
    }
    return str;
}

function formatToIsoDob(val) {
    if (!val) return null;
    const str = String(val).trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
        const [day, month, year] = str.split("/");
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    const isoPart = str.split("T")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoPart)) {
        return isoPart;
    }
    return null;
}

function validateDobString(val, isRequired = true) {
    if (!val || typeof val !== "string" || !val.trim()) {
        return isRequired
            ? { valid: false, error: "Date of birth is required." }
            : { valid: true, error: null };
    }
    const str = val.trim();
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
        return { valid: false, error: "Date of birth must be in DD/MM/YYYY format (e.g. 15/08/2005)." };
    }
    const [dStr, mStr, yStr] = str.split("/");
    const day = parseInt(dStr, 10);
    const month = parseInt(mStr, 10);
    const year = parseInt(yStr, 10);
    const currentYear = new Date().getFullYear();

    if (year < 1900 || year > currentYear) {
        return { valid: false, error: `Year must be between 1900 and ${currentYear}.` };
    }
    if (month < 1 || month > 12) {
        return { valid: false, error: "Month must be between 01 and 12." };
    }
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) {
        return { valid: false, error: `Invalid date. The selected month has only ${daysInMonth} days.` };
    }

    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (birthDate > today) {
        return { valid: false, error: "Date of birth cannot be a future date." };
    }

    return { valid: true, error: null };
}

function calculateAgeFromDob(dobString) {
    if (!dobString) return "";
    let birth = null;
    const str = String(dobString).trim();
    if (str.includes("/")) {
        const parts = str.split("/");
        if (parts.length === 3) {
            const [d, m, y] = parts;
            const day = parseInt(d, 10);
            const month = parseInt(m, 10);
            const year = parseInt(y, 10);
            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                birth = new Date(year, month - 1, day);
            }
        }
    } else if (str.includes("-")) {
        const isoPart = str.split("T")[0];
        const parts = isoPart.split("-");
        if (parts.length === 3) {
            const [y, m, d] = parts;
            birth = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
        }
    } else {
        birth = new Date(str);
    }

    if (!birth || isNaN(birth.getTime())) return "";
    const today = new Date();
    let ageVal = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        ageVal--;
    }
    return ageVal >= 0 && ageVal <= 150 ? String(ageVal) : "";
}

function CreateProfile() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: "",
        gender: "",
        age: "",
        dob: "",
        state: "",
        district: "",
        annualFamilyIncome: "",
        phoneNumber: "",
        occupation_type: "student",
        // Student conditional fields
        education_level: "",
        institution_name: "",
        course_or_degree: "",
        // Worker conditional fields
        employment_type: "",
        industry_or_sector: "",
        employer_name: "",
    });

    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const datePickerRef = useRef(null);

    const openCalendarPicker = () => {
        if (datePickerRef.current) {
            if (typeof datePickerRef.current.showPicker === "function") {
                datePickerRef.current.showPicker();
            } else {
                datePickerRef.current.focus();
                datePickerRef.current.click();
            }
        }
    };

    const handleDobChange = (e) => {
        const raw = e.target.value;
        if (!raw) {
            setFormData((prev) => ({ ...prev, dob: "" }));
            return;
        }

        const trimmed = raw.trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
            const [y, m, d] = trimmed.split("T")[0].split("-");
            const formatted = `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
            setFormData((prev) => {
                const updated = { ...prev, dob: formatted };
                if (!prev.age) {
                    const derived = calculateAgeFromDob(formatted);
                    if (derived) updated.age = derived;
                }
                return updated;
            });
            return;
        }

        let cleaned = raw.replace(/[^0-9/]/g, "").slice(0, 10);
        const digitsOnly = cleaned.replace(/\D/g, "");
        if (!cleaned.includes("/") && digitsOnly.length > 2) {
            if (digitsOnly.length <= 4) {
                cleaned = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
            } else {
                cleaned = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4, 8)}`;
            }
        }

        setFormData((prev) => {
            const updated = { ...prev, dob: cleaned };
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) {
                const derived = calculateAgeFromDob(cleaned);
                if (derived && !prev.age) {
                    updated.age = derived;
                }
            }
            return updated;
        });
    };

    const handleCalendarDateSelect = (e) => {
        const isoVal = e.target.value;
        if (!isoVal) return;
        const formatted = formatToDisplayDob(isoVal);
        setFormData((prev) => {
            const updated = { ...prev, dob: formatted };
            const derived = calculateAgeFromDob(formatted);
            if (derived) {
                updated.age = derived;
            }
            return updated;
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "age") {
            // Strict whole-number enforcement: accept empty or digits only
            if (value === "" || /^[0-9]+$/.test(value)) {
                setFormData((prev) => ({
                    ...prev,
                    age: value,
                }));
            }
            return;
        }

        setFormData((prev) => {
            const updated = {
                ...prev,
                [name]: value,
                ...(name === "state" ? { district: "" } : {}),
            };

            // If DOB is entered and age is not manually set, auto-derive age
            if (name === "dob" && value && !prev.age) {
                const derived = calculateAgeFromDob(value);
                if (derived) {
                    updated.age = derived;
                }
            }

            return updated;
        });
    };

    const handleOccupationChange = (newType) => {
        setFormData((prev) => ({
            ...prev,
            occupation_type: newType === "worker" ? "worker" : "student",
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const token = localStorage.getItem("access_token");

        if (!token) {
            setError("Session unauthenticated. Please sign in or register first.");
            return;
        }

        if (!formData.fullName.trim()) {
            setError("Full name is required.");
            return;
        }

        // Validate DOB
        if (!formData.dob) {
            setError("Date of birth is required.");
            return;
        }
        const dobValidation = validateDobString(formData.dob, true);
        if (!dobValidation.valid) {
            setError(dobValidation.error);
            return;
        }

        // Validate age if provided
        let parsedAge = null;
        if (formData.age !== "" && formData.age !== undefined && formData.age !== null) {
            if (!/^[0-9]+$/.test(String(formData.age).trim())) {
                setError("Age must be a valid whole number (no decimals or negative values).");
                return;
            }
            const numAge = Number.parseInt(formData.age, 10);
            if (isNaN(numAge) || numAge < 0 || numAge > 150) {
                setError("Please enter a realistic age between 0 and 150.");
                return;
            }
            parsedAge = numAge;
        }

        if (!formData.state) {
            setError("Please select your State / Union Territory.");
            return;
        }

        if (!formData.district) {
            setError("Please select your district.");
            return;
        }

        if (!formData.phoneNumber || !/^[0-9]{10}$/.test(formData.phoneNumber.trim())) {
            setError("Please provide a valid 10-digit phone number.");
            return;
        }

        const numericIncome = Number(formData.annualFamilyIncome);
        if (isNaN(numericIncome) || numericIncome < 0 || formData.annualFamilyIncome === "") {
            setError("Please enter a valid annual family income as a number.");
            return;
        }

        const isStudent = formData.occupation_type === "student";

        // Validate visible conditional fields (only for active occupation)
        if (isStudent && formData.education_level && !formData.education_level.trim()) {
            setError("Please select a valid education level.");
            return;
        }

        setIsSubmitting(true);

        const commonPayload = {
            full_name: formData.fullName.trim(),
            gender: formData.gender === "prefer_not_to_say" ? "other" : (formData.gender || "other"),
            age: parsedAge,
            dob: formatToIsoDob(formData.dob),
            state: formData.state,
            district: formData.district,
            phone_number: formData.phoneNumber.trim(),
            annual_family_income: numericIncome,
            occupation_type: isStudent ? "student" : "worker",
        };

        // Do not submit hidden fields: send student fields ONLY for student, worker fields ONLY for worker
        const profilePayload = isStudent
            ? {
                ...commonPayload,
                education_level: formData.education_level || null,
                institution_name: formData.institution_name ? formData.institution_name.trim() : null,
                course_or_degree: formData.course_or_degree ? formData.course_or_degree.trim() : null,
            }
            : {
                ...commonPayload,
                employment_type: formData.employment_type ? formData.employment_type.trim() : null,
                industry_or_sector: formData.industry_or_sector ? formData.industry_or_sector.trim() : null,
                employer_name: formData.employer_name ? formData.employer_name.trim() : null,
            };

        try {
            let saved = null;
            try {
                saved = await apiClient("/api/profile/", {
                    method: "POST",
                    body: profilePayload,
                    requiresAuth: true,
                });
            } catch (err) {
                // If 400 (profile already exists), attempt partial update
                const userId = localStorage.getItem("user_id");
                if (err.status === 400 && userId) {
                    saved = await apiClient(`/api/profile/${userId}`, {
                        method: "PUT",
                        body: profilePayload,
                        requiresAuth: true,
                    });
                } else {
                    throw err;
                }
            }

            if (saved) {
                const currentUserId = saved.user_id ? String(saved.user_id) : (localStorage.getItem("user_id") || "guest");
                localStorage.setItem("citizenProfile", JSON.stringify(saved));
                localStorage.setItem(`citizenProfile_${currentUserId}`, JSON.stringify(saved));
                localStorage.setItem("user_name", saved.full_name || formData.fullName);
                if (saved.user_id) {
                    localStorage.setItem("user_id", String(saved.user_id));
                }
            }

            navigate("/home");
        } catch (err) {
            setError(err.message || "Failed to save profile. Please verify all fields.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const states = indianStates;

    const districts = stateDistricts[formData.state] || [];

    return (
        <div className="auth-page">
            <div className="auth-left">
                <div className="auth-brand">
                    <div className="brand-icon">
                        <UserRound size={25} />
                    </div>
                    <span>CivicEase</span>
                </div>

                <div className="auth-left-content">
                    <h1>Your profile.<br />Your identity.</h1>

                    <p>
                        Complete your citizen profile to help us find the
                        government services and schemes relevant to you.
                    </p>

                    <div className="auth-feature">
                        <ShieldCheck size={20} />
                        <span>Your personal information stays protected.</span>
                    </div>
                </div>

                <div className="auth-footer">
                    © 2026 CivicEase. Empowering citizens.
                </div>
            </div>

            <div className="auth-right">
                <div className="auth-form-container">
                    <div className="auth-heading">
                        <span className="auth-tag">PROFILE SETUP</span>
                        <h2>Create your profile</h2>
                        <p>Tell us a little about yourself.</p>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="fullName"
                                placeholder="Enter your full name"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="dob">Date of Birth</label>
                            <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
                                <input
                                    id="dob"
                                    type="text"
                                    name="dob"
                                    placeholder="DD/MM/YYYY"
                                    value={formData.dob}
                                    onChange={handleDobChange}
                                    maxLength={10}
                                    style={{ paddingRight: "44px" }}
                                    required
                                />
                                <button
                                    type="button"
                                    id="dob-calendar-btn"
                                    onClick={openCalendarPicker}
                                    aria-label="Open calendar picker"
                                    title="Open calendar picker"
                                    style={{
                                        position: "absolute",
                                        right: "12px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        background: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: "4px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#6b7280",
                                        transition: "color 0.15s ease",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = "#367c4b")}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
                                >
                                    <CalendarDays size={18} />
                                </button>
                                <input
                                    type="date"
                                    ref={datePickerRef}
                                    tabIndex={-1}
                                    aria-hidden="true"
                                    max={getTodayIso()}
                                    value={formatToIsoDob(formData.dob) || ""}
                                    onChange={handleCalendarDateSelect}
                                    style={{
                                        position: "absolute",
                                        opacity: 0,
                                        pointerEvents: "none",
                                        width: 0,
                                        height: 0,
                                        border: 0,
                                        padding: 0,
                                        margin: 0,
                                        overflow: "hidden",
                                    }}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="gender">Gender</label>
                            <select
                                id="gender"
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                            >
                                <option value="">Select gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="age">Age (Years)</label>
                            <input
                                id="age"
                                type="number"
                                name="age"
                                placeholder="Enter age (whole number, e.g. 21)"
                                value={formData.age}
                                onChange={handleChange}
                                min="0"
                                max="150"
                                step="1"
                            />
                        </div>

                        <div className="form-group">
                            <label>State / Union Territory</label>
                            <select
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select your state / UT</option>
                                {states.map((state) => (
                                    <option key={state} value={state}>
                                        {state}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>District</label>
                            <select
                                name="district"
                                value={formData.district}
                                onChange={handleChange}
                                disabled={!formData.state}
                                required
                            >
                                <option value="">
                                    {formData.state
                                        ? "Select your district"
                                        : "Select state first"}
                                </option>

                                {districts.map((district) => (
                                    <option key={district} value={district}>
                                        {district}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="annualFamilyIncome">Annual Family Income (₹)</label>
                            <input
                                id="annualFamilyIncome"
                                type="number"
                                name="annualFamilyIncome"
                                placeholder="Enter annual family income (e.g. 180000)"
                                value={formData.annualFamilyIncome}
                                onChange={handleChange}
                                min="0"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phoneNumber">Phone Number</label>
                            <input
                                id="phoneNumber"
                                type="tel"
                                name="phoneNumber"
                                placeholder="Enter 10-digit phone number"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                pattern="[0-9]{10}"
                                maxLength="10"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="occupation_type">Occupation Type</label>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "12px",
                                    marginTop: "6px",
                                }}
                            >
                                <button
                                    type="button"
                                    id="occupation-student-btn"
                                    onClick={() => handleOccupationChange("student")}
                                    style={{
                                        padding: "11px 16px",
                                        borderRadius: "8px",
                                        border: formData.occupation_type === "student" ? "2px solid #367c4b" : "1px solid #d1d5db",
                                        background: formData.occupation_type === "student" ? "#f0fff4" : "#ffffff",
                                        color: formData.occupation_type === "student" ? "#235a34" : "#374151",
                                        fontWeight: "750",
                                        fontSize: "13px",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "8px",
                                        transition: "all 0.2s ease",
                                    }}
                                >
                                    <GraduationCap size={18} color={formData.occupation_type === "student" ? "#367c4b" : "#6b7280"} />
                                    Student
                                </button>
                                <button
                                    type="button"
                                    id="occupation-worker-btn"
                                    onClick={() => handleOccupationChange("worker")}
                                    style={{
                                        padding: "11px 16px",
                                        borderRadius: "8px",
                                        border: formData.occupation_type === "worker" ? "2px solid #367c4b" : "1px solid #d1d5db",
                                        background: formData.occupation_type === "worker" ? "#f0fff4" : "#ffffff",
                                        color: formData.occupation_type === "worker" ? "#235a34" : "#374151",
                                        fontWeight: "750",
                                        fontSize: "13px",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "8px",
                                        transition: "all 0.2s ease",
                                    }}
                                >
                                    <Briefcase size={18} color={formData.occupation_type === "worker" ? "#367c4b" : "#6b7280"} />
                                    Worker
                                </button>
                            </div>
                            <input
                                type="hidden"
                                id="occupation_type"
                                name="occupation_type"
                                value={formData.occupation_type}
                            />
                        </div>

                        {/* STUDENT CONDITIONAL FIELDS */}
                        {formData.occupation_type === "student" && (
                            <div
                                style={{
                                    borderTop: "1px dashed #e2e8f0",
                                    paddingTop: "16px",
                                    marginTop: "16px",
                                    marginBottom: "16px",
                                }}
                            >
                                <div style={{ marginBottom: "14px" }}>
                                    <h3
                                        style={{
                                            fontSize: "15px",
                                            fontWeight: "750",
                                            color: "#1e293b",
                                            margin: 0,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        <GraduationCap size={18} color="#367c4b" />
                                        Student Information
                                    </h3>
                                    <p style={{ fontSize: "12px", color: "#64748b", margin: "3px 0 0" }}>
                                        Details about your current education, institution, and enrolled course.
                                    </p>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="education_level">Education Level</label>
                                    <select
                                        id="education_level"
                                        name="education_level"
                                        value={formData.education_level}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select education level</option>
                                        <option value="Below 10th">Below 10th</option>
                                        <option value="10th Pass">10th Pass</option>
                                        <option value="12th Pass">12th Pass</option>
                                        <option value="Diploma">Diploma</option>
                                        <option value="Undergraduate">Undergraduate</option>
                                        <option value="Postgraduate">Postgraduate</option>
                                        <option value="Doctorate">Doctorate</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="institution_name">Institution Name</label>
                                    <input
                                        id="institution_name"
                                        type="text"
                                        name="institution_name"
                                        placeholder="School / College / University name"
                                        value={formData.institution_name}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="course_or_degree">Course or Degree</label>
                                    <input
                                        id="course_or_degree"
                                        type="text"
                                        name="course_or_degree"
                                        placeholder="e.g. B.Tech Computer Science, B.Com, Higher Secondary"
                                        value={formData.course_or_degree}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        )}

                        {/* WORKER CONDITIONAL FIELDS */}
                        {formData.occupation_type === "worker" && (
                            <div
                                style={{
                                    borderTop: "1px dashed #e2e8f0",
                                    paddingTop: "16px",
                                    marginTop: "16px",
                                    marginBottom: "16px",
                                }}
                            >
                                <div style={{ marginBottom: "14px" }}>
                                    <h3
                                        style={{
                                            fontSize: "15px",
                                            fontWeight: "750",
                                            color: "#1e293b",
                                            margin: 0,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        <Briefcase size={18} color="#367c4b" />
                                        Worker Information
                                    </h3>
                                    <p style={{ fontSize: "12px", color: "#64748b", margin: "3px 0 0" }}>
                                        Details about your employment status, industry sector, and employer.
                                    </p>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="employment_type">Employment Type</label>
                                    <select
                                        id="employment_type"
                                        name="employment_type"
                                        value={formData.employment_type}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select employment type</option>
                                        <option value="Full-time">Full-time</option>
                                        <option value="Part-time">Part-time</option>
                                        <option value="Salaried">Salaried</option>
                                        <option value="Self-employed">Self-employed</option>
                                        <option value="Contract">Contract</option>
                                        <option value="Daily Wage">Daily Wage</option>
                                        <option value="Apprentice / Intern">Apprentice / Intern</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="industry_or_sector">Industry or Sector</label>
                                    <input
                                        id="industry_or_sector"
                                        type="text"
                                        name="industry_or_sector"
                                        placeholder="e.g. Information Technology, Agriculture, Manufacturing, Healthcare"
                                        value={formData.industry_or_sector}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="employer_name">Employer Name</label>
                                    <input
                                        id="employer_name"
                                        type="text"
                                        name="employer_name"
                                        placeholder="e.g. Example Technologies, State Transport, Self-Employed"
                                        value={formData.employer_name}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        )}

                        {error && <div className="auth-error">{error}</div>}

                        <button type="submit" className="auth-button" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <RefreshCw size={18} className="spin-animation" />
                                    Saving Citizen Profile...
                                </>
                            ) : (
                                <>
                                    Save Profile <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="auth-security">
                        <ShieldCheck size={16} />
                        <span>Your information is securely stored.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CreateProfile;