from pybaseball import statcast   # Savant endpoint includes advanced batted-ball metrics
import pandas as pd

# Download everything from Spring Training through September
df = pd.read_csv("files/2024/april_2024.csv")

# Look at the first few swings’ attack angles


print(df['attack_angle'].describe())
