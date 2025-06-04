import pandas as pd
# Install pybaseball if required
# !pip install pybaseball
from pybaseball import statcast
from pathlib import Path

month_dict = {'03': 'March',
              '04': 'April',
              '05': 'May',
              '06': 'June',
              '07': 'July',
              '08': 'August',
              '09': 'September',
              '10': 'October'}

def statcast_data(year: str):
    files_folder = Path(f"files/{year}/")
    files_folder.mkdir(exist_ok=True)

    march_data = statcast(start_dt=f"{year}-03-28", end_dt=f"{year}-03-31")
    march_data.to_csv(files_folder / f'march_{year}.csv', index=False)

    for month in ['04', '05', '06', '07', '08', '09','10']:
        if month in ['04', '06', '09']:
            end_date = '30'
        else:
            end_date = '31'
        month_data = statcast(start_dt=f"{year}-{month}-01", end_dt=f"{year}-{month}-{end_date}")
        month_data.to_csv(files_folder / f'{month_dict[month].lower()}_{year}.csv', index=False)

    month_csvs = [file for file in files_folder.glob("*.csv") if not file.name.startswith("savant")]

    for file in month_csvs:
        try:
            pd.read_csv(file)
        except Exception as e:
            print(f"Error in file: {file}")
            print(e)

    monthly_games = pd.concat((pd.read_csv(file) for file in month_csvs), ignore_index=True)
    monthly_games.drop_duplicates(inplace=True)

    output_path = files_folder / f"savantdata-{year}.csv"
    monthly_games.to_csv(output_path, index=False)

statcast_data('2024')