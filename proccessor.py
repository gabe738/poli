import csv

def read_existing_values(filename):
    existing_values = set()
    try:
        with open(filename, 'r', newline='', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            for row in reader:
                existing_values.add(row[0])
    except FileNotFoundError:
        pass
    return existing_values

def main():
    input_filename = "us_cities_states_counties.csv"
    output_filename = "output.csv"
    existing_values = read_existing_values(output_filename)

    with open(input_filename, 'r', newline='', encoding='utf-8') as infile, \
         open(output_filename, 'a', newline='', encoding='utf-8') as outfile:
        
        reader = csv.reader(infile)
        writer = csv.writer(outfile)

        for row in reader:
            value = row[0].split('|')[0].strip()
            if value not in existing_values:
                writer.writerow([value])
                existing_values.add(value)

if __name__ == "__main__":
    main()
