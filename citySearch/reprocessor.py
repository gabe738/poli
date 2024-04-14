with open("output.csv", "r") as inp:
    with open("output2.csv", "w") as out:
        newLines = []
        for line in inp: newLines.append(f"{line.strip()[1:-1]}\n")
        out.writelines(newLines)